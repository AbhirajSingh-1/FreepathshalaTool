const { db } = require("../config/firebase");
const { COLLECTIONS } = require("../config/collections");
const { AppError } = require("../utils/AppError");
const { nextId } = require("../utils/idGenerator");
const {
  fromDoc,
  fromSnapshot,
  auditCreate,
  auditUpdate,
  cleanUndefined
} = require("../utils/firestore");
const { toNumber } = require("../utils/businessRules");
const { upsertLocationsFromPayload } = require("./location.service");

function partnersCollection() {
  return db.collection(COLLECTIONS.PICKUP_PARTNERS);
}

async function listPickupPartners(filters = {}) {
  let query = partnersCollection().orderBy("createdAt", "desc");
  if (filters.city) query = query.where("city", "==", filters.city);
  const snapshot = await query.limit(filters.limit || 100).get();
  let partners = fromSnapshot(snapshot);

  if (filters.q) {
    const needle = filters.q.toLowerCase();
    partners = partners.filter((partner) => [
      partner.name,
      partner.mobile,
      partner.area,
      ...(partner.sectors || []),
      ...(partner.societies || [])
    ].some((value) => String(value || "").toLowerCase().includes(needle)));
  }

  return partners;
}

async function getPickupPartner(id) {
  const doc = await partnersCollection().doc(id).get();
  const partner = fromDoc(doc);
  if (!partner) throw new AppError("Pickup partner not found", 404, "PICKUP_PARTNER_NOT_FOUND");
  return partner;
}

async function findPartnerByName(name, tx) {
  if (!name) return null;
  const query = partnersCollection().where("name", "==", name).limit(1);
  const snapshot = tx ? await tx.get(query) : await query.get();
  if (snapshot.empty) return null;
  return { ref: snapshot.docs[0].ref, data: fromDoc(snapshot.docs[0]) };
}

async function createPickupPartner(data, actor) {
  const created = await db.runTransaction(async (tx) => {
    const id = data.id || await nextId("pickupPartners", tx);
    const ref = partnersCollection().doc(id);
    const payload = cleanUndefined({
      ...data,
      id,
      rating: toNumber(data.rating, 4),
      totalPickups: toNumber(data.totalPickups),
      totalValue: toNumber(data.totalValue),
      amountReceived: toNumber(data.amountReceived),
      pendingAmount: toNumber(data.pendingAmount),
      transactions: data.transactions || [],
      active: data.active !== false,
      ...auditCreate(actor)
    });

    tx.set(ref, payload);
    await upsertLocationsFromPayload(payload, actor, tx);
    return { ...payload, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  });

  return created;
}

async function updatePickupPartner(id, data, actor) {
  const ref = partnersCollection().doc(id);
  const doc = await ref.get();
  if (!doc.exists) throw new AppError("Pickup partner not found", 404, "PICKUP_PARTNER_NOT_FOUND");

  await ref.set(cleanUndefined({
    ...data,
    ...auditUpdate(actor)
  }), { merge: true });
  await upsertLocationsFromPayload({ ...doc.data(), ...data }, actor);

  return getPickupPartner(id);
}

async function deletePickupPartner(id) {
  const ref = partnersCollection().doc(id);
  const doc = await ref.get();
  if (!doc.exists) throw new AppError("Pickup partner not found", 404, "PICKUP_PARTNER_NOT_FOUND");
  await ref.delete();
  return { id, deleted: true };
}

module.exports = {
  partnersCollection,
  listPickupPartners,
  getPickupPartner,
  findPartnerByName,
  createPickupPartner,
  updatePickupPartner,
  deletePickupPartner
};
