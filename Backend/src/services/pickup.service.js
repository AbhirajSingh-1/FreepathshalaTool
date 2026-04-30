const { db } = require("../config/firebase");
const { COLLECTIONS } = require("../config/collections");
const { AppError } = require("../utils/AppError");
const { nextId } = require("../utils/idGenerator");
const {
  fromDoc,
  fromSnapshot,
  auditCreate,
  auditUpdate,
  cleanUndefined,
  increment,
  arrayUnion
} = require("../utils/firestore");
const {
  toNumber,
  derivePaymentStatus,
  deriveDonorStatus,
  inferPickupType,
  buildDonorSnapshot,
  buildPartnerSnapshot,
  buildRaddiRecordFromPickup
} = require("../utils/businessRules");
const { donorsCollection } = require("./donor.service");
const { partnersCollection, findPartnerByName } = require("./pickupPartner.service");
const { upsertLocationsFromPayload } = require("./location.service");

function pickupsCollection() {
  return db.collection(COLLECTIONS.PICKUPS);
}

function pickupPendingAmount(pickup) {
  if (pickup.paymentStatus === "Write Off") return 0;
  return Math.max(0, toNumber(pickup.totalValue) - toNumber(pickup.amountPaid));
}

function pickupTransactionSummary(pickup) {
  return {
    date: pickup.date || "",
    pickupId: pickup.id,
    donor: pickup.donorName || "",
    society: pickup.society || "",
    value: toNumber(pickup.totalValue),
    paid: toNumber(pickup.amountPaid),
    status: pickup.paymentStatus || derivePaymentStatus(pickup.totalValue, pickup.amountPaid)
  };
}

async function resolveDonorAndPartner(tx, data) {
  let donorRef = null;
  let donor = null;
  if (data.donorId) {
    donorRef = donorsCollection().doc(data.donorId);
    const donorDoc = await tx.get(donorRef);
    if (donorDoc.exists) donor = fromDoc(donorDoc);
  }

  let partnerRef = null;
  let partner = null;
  if (data.partnerId) {
    partnerRef = partnersCollection().doc(data.partnerId);
    const partnerDoc = await tx.get(partnerRef);
    if (partnerDoc.exists) partner = fromDoc(partnerDoc);
  } else {
    const partnerName = data.PickupPartner || data.pickupPartnerName;
    const match = await findPartnerByName(partnerName, tx);
    if (match) {
      partnerRef = match.ref;
      partner = match.data;
    }
  }

  return { donorRef, donor, partnerRef, partner };
}

function buildPickupPayload(data, donor, partner, id) {
  const donorSnapshot = donor ? buildDonorSnapshot(donor) : {};
  const partnerSnapshot = partner ? buildPartnerSnapshot(partner) : {};
  const totalValue = toNumber(data.totalValue);
  const amountPaid = toNumber(data.amountPaid);
  const paymentStatus = derivePaymentStatus(totalValue, amountPaid, data.paymentStatus);
  const rstItems = data.rstItems || [];
  const sksItems = data.sksItems || [];

  return cleanUndefined({
    ...data,
    ...donorSnapshot,
    ...partnerSnapshot,
    id,
    orderId: data.orderId || id,
    donorId: data.donorId || donor?.id || null,
    partnerId: data.partnerId || partner?.id || null,
    donorSnapshot: donor ? buildDonorSnapshot(donor) : null,
    pickupPartnerSnapshot: partner ? buildPartnerSnapshot(partner) : null,
    status: data.status || "Pending",
    type: data.type || inferPickupType(rstItems, sksItems, "RST"),
    pickupMode: data.pickupMode || "Individual",
    rstItems,
    sksItems,
    totalKgs: toNumber(data.totalKgs ?? data.totalKg),
    totalKg: toNumber(data.totalKg ?? data.totalKgs),
    totalValue,
    amountPaid,
    paymentStatus
  });
}

function applyCompletedPickupSideEffects(tx, pickup, donorRef, partnerRef, partner) {
  if (pickup.status !== "Completed") return;

  if (donorRef) {
    tx.set(donorRef, cleanUndefined({
      lastPickup: pickup.date || new Date().toISOString().slice(0, 10),
      nextPickup: pickup.nextDate || null,
      totalRST: increment(toNumber(pickup.totalValue)),
      totalSKS: increment((pickup.sksItems || []).length ? 1 : 0),
      status: deriveDonorStatus(pickup.date || new Date().toISOString().slice(0, 10))
    }), { merge: true });
  }

  if (partnerRef) {
    const pending = pickupPendingAmount(pickup);
    tx.set(partnerRef, {
      totalPickups: increment(1),
      totalValue: increment(toNumber(pickup.totalValue)),
      amountReceived: increment(toNumber(pickup.amountPaid)),
      pendingAmount: increment(pending),
      transactions: arrayUnion(pickupTransactionSummary({
        ...pickup,
        PickupPartner: partner?.name || pickup.PickupPartner
      }))
    }, { merge: true });
  }
}

function applyCompletedPickupDelta(tx, oldPickup, newPickup, oldPartnerRef, newPartnerRef) {
  const oldCompleted = oldPickup.status === "Completed";
  const newCompleted = newPickup.status === "Completed";

  const oldValue = oldCompleted ? toNumber(oldPickup.totalValue) : 0;
  const oldPaid = oldCompleted ? toNumber(oldPickup.amountPaid) : 0;
  const oldPending = oldCompleted ? pickupPendingAmount(oldPickup) : 0;
  const newValue = newCompleted ? toNumber(newPickup.totalValue) : 0;
  const newPaid = newCompleted ? toNumber(newPickup.amountPaid) : 0;
  const newPending = newCompleted ? pickupPendingAmount(newPickup) : 0;

  if (oldPartnerRef && oldPartnerRef.path !== newPartnerRef?.path) {
    tx.set(oldPartnerRef, {
      totalPickups: increment(oldCompleted ? -1 : 0),
      totalValue: increment(-oldValue),
      amountReceived: increment(-oldPaid),
      pendingAmount: increment(-oldPending)
    }, { merge: true });
  }

  if (newPartnerRef) {
    const samePartner = oldPartnerRef?.path === newPartnerRef.path;
    tx.set(newPartnerRef, {
      totalPickups: increment(samePartner ? (newCompleted && !oldCompleted ? 1 : !newCompleted && oldCompleted ? -1 : 0) : (newCompleted ? 1 : 0)),
      totalValue: increment(samePartner ? newValue - oldValue : newValue),
      amountReceived: increment(samePartner ? newPaid - oldPaid : newPaid),
      pendingAmount: increment(samePartner ? newPending - oldPending : newPending)
    }, { merge: true });
  }
}

async function listPickups(filters = {}) {
  let query = pickupsCollection().orderBy("date", "desc");
  if (filters.status) query = query.where("status", "==", filters.status);
  if (filters.donorId) query = query.where("donorId", "==", filters.donorId);
  if (filters.partnerId) query = query.where("partnerId", "==", filters.partnerId);
  if (filters.city) query = query.where("city", "==", filters.city);
  if (filters.sector) query = query.where("sector", "==", filters.sector);
  if (filters.dateFrom) query = query.where("date", ">=", filters.dateFrom);
  if (filters.dateTo) query = query.where("date", "<=", filters.dateTo);

  const snapshot = await query.limit(filters.limit || 100).get();
  let pickups = fromSnapshot(snapshot);

  if (filters.q) {
    const needle = filters.q.toLowerCase();
    pickups = pickups.filter((pickup) => [
      pickup.id,
      pickup.orderId,
      pickup.donorName,
      pickup.mobile,
      pickup.society,
      pickup.PickupPartner,
      pickup.pickupPartnerName
    ].some((value) => String(value || "").toLowerCase().includes(needle)));
  }

  return pickups;
}

async function getPickup(id) {
  const doc = await pickupsCollection().doc(id).get();
  const pickup = fromDoc(doc);
  if (!pickup) throw new AppError("Pickup not found", 404, "PICKUP_NOT_FOUND");
  return pickup;
}

async function createPickup(data, actor) {
  return db.runTransaction(async (tx) => {
    const { donorRef, donor, partnerRef, partner } = await resolveDonorAndPartner(tx, data);
    const id = data.id || data.orderId || await nextId("pickups", tx);
    const ref = pickupsCollection().doc(id);
    const payload = {
      ...buildPickupPayload(data, donor, partner, id),
      ...auditCreate(actor)
    };

    tx.set(ref, payload);
    await upsertLocationsFromPayload(payload, actor, tx);
    applyCompletedPickupSideEffects(tx, payload, donorRef, partnerRef, partner);

    return {
      ...payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });
}

async function updatePickup(id, data, actor) {
  return db.runTransaction(async (tx) => {
    const ref = pickupsCollection().doc(id);
    const currentDoc = await tx.get(ref);
    if (!currentDoc.exists) throw new AppError("Pickup not found", 404, "PICKUP_NOT_FOUND");

    const oldPickup = fromDoc(currentDoc);
    const merged = { ...oldPickup, ...data, id };
    const { donorRef, donor, partnerRef, partner } = await resolveDonorAndPartner(tx, merged);
    const oldPartnerRef = oldPickup.partnerId ? partnersCollection().doc(oldPickup.partnerId) : null;
    const newPickup = {
      ...buildPickupPayload(merged, donor || oldPickup.donorSnapshot, partner || oldPickup.pickupPartnerSnapshot, id),
      ...auditUpdate(actor)
    };

    tx.set(ref, newPickup, { merge: true });
    await upsertLocationsFromPayload(newPickup, actor, tx);
    applyCompletedPickupDelta(tx, oldPickup, newPickup, oldPartnerRef, partnerRef);

    if (donorRef && oldPickup.status !== "Completed" && newPickup.status === "Completed") {
      tx.set(donorRef, cleanUndefined({
        lastPickup: newPickup.date || new Date().toISOString().slice(0, 10),
        nextPickup: newPickup.nextDate || null,
        totalRST: increment(toNumber(newPickup.totalValue)),
        totalSKS: increment((newPickup.sksItems || []).length ? 1 : 0),
        status: deriveDonorStatus(newPickup.date || new Date().toISOString().slice(0, 10))
      }), { merge: true });
    }

    return {
      ...oldPickup,
      ...newPickup,
      updatedAt: new Date().toISOString()
    };
  });
}

async function recordPickup(id, data, actor) {
  return updatePickup(id, {
    ...data,
    status: "Completed"
  }, actor);
}

async function deletePickup(id) {
  const ref = pickupsCollection().doc(id);
  const doc = await ref.get();
  if (!doc.exists) throw new AppError("Pickup not found", 404, "PICKUP_NOT_FOUND");
  await ref.delete();
  return { id, deleted: true };
}

async function listRaddiRecords(filters = {}) {
  const pickups = await listPickups({
    ...filters,
    status: "Completed",
    limit: filters.limit || 200
  });

  return pickups.map((pickup) => buildRaddiRecordFromPickup(
    pickup,
    pickup.donorSnapshot || pickup,
    pickup.pickupPartnerSnapshot || pickup
  ));
}

module.exports = {
  pickupsCollection,
  pickupPendingAmount,
  pickupTransactionSummary,
  listPickups,
  getPickup,
  createPickup,
  updatePickup,
  recordPickup,
  deletePickup,
  listRaddiRecords
};
