const { db } = require("../config/firebase");
const { COLLECTIONS } = require("../config/collections");
const { AppError } = require("../utils/AppError");
const {
  fromDoc,
  fromSnapshot,
  auditCreate,
  increment,
  cleanUndefined
} = require("../utils/firestore");
const {
  toNumber,
  derivePaymentStatus
} = require("../utils/businessRules");
const {
  pickupsCollection,
  pickupPendingAmount,
  pickupTransactionSummary
} = require("./pickup.service");
const { partnersCollection } = require("./pickupPartner.service");

function paymentsCollection(pickupId) {
  return pickupsCollection().doc(pickupId).collection(COLLECTIONS.PAYMENTS);
}

function updatePartnerTransactions(transactions = [], pickup, paymentStatus) {
  const summary = pickupTransactionSummary({
    ...pickup,
    paymentStatus
  });

  const index = transactions.findIndex((tx) => tx.pickupId === pickup.id);
  if (index === -1) return [...transactions, summary];

  return transactions.map((tx, i) => i === index
    ? {
      ...tx,
      value: summary.value,
      paid: summary.paid,
      status: summary.status,
      date: summary.date,
      donor: summary.donor,
      society: summary.society
    }
    : tx);
}

function paymentPayload({ pickup, partnerId, amount, data, actor, cumulative }) {
  return cleanUndefined({
    pickupId: pickup.id,
    orderId: pickup.orderId || pickup.id,
    partnerId,
    amount,
    cumulative,
    refMode: data.refMode || "cash",
    refValue: data.refValue || "",
    notes: data.notes || "",
    date: data.date || new Date().toISOString().slice(0, 10),
    screenshot: data.screenshot || null,
    writeOff: data.writeOff === true,
    ...auditCreate(actor)
  });
}

function paymentHistoryEntry(payment) {
  const timestamp = new Date().toISOString();
  return {
    ...payment,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

async function listPayments(filters = {}) {
  let query = db.collectionGroup(COLLECTIONS.PAYMENTS);
  if (filters.pickupId) query = query.where("pickupId", "==", filters.pickupId);
  if (filters.partnerId) query = query.where("partnerId", "==", filters.partnerId);
  if (filters.dateFrom) query = query.where("date", ">=", filters.dateFrom);
  if (filters.dateTo) query = query.where("date", "<=", filters.dateTo);
  const snapshot = await query.limit(filters.limit || 100).get();
  return fromSnapshot(snapshot);
}

async function getPickupPayments(pickupId) {
  const snapshot = await paymentsCollection(pickupId).orderBy("createdAt", "desc").get();
  return fromSnapshot(snapshot);
}

async function recordSinglePickupPayment(partnerId, data, actor) {
  if (!data.pickupId) {
    throw new AppError("pickupId is required for single-pickup payment", 422, "PICKUP_ID_REQUIRED");
  }

  return db.runTransaction(async (tx) => {
    const partnerRef = partnersCollection().doc(partnerId);
    const pickupRef = pickupsCollection().doc(data.pickupId);
    const partnerDoc = await tx.get(partnerRef);
    const pickupDoc = await tx.get(pickupRef);

    if (!partnerDoc.exists) throw new AppError("Pickup partner not found", 404, "PICKUP_PARTNER_NOT_FOUND");
    if (!pickupDoc.exists) throw new AppError("Pickup not found", 404, "PICKUP_NOT_FOUND");

    const partner = fromDoc(partnerDoc);
    const pickup = fromDoc(pickupDoc);
    const currentPaid = toNumber(pickup.amountPaid);
    const currentPending = pickupPendingAmount(pickup);
    const amount = data.writeOff ? 0 : toNumber(data.amount);

    if (!data.writeOff && amount <= 0) {
      throw new AppError("Payment amount must be greater than zero", 422, "INVALID_PAYMENT_AMOUNT");
    }
    if (!data.writeOff && amount > currentPending) {
      throw new AppError("Payment amount cannot exceed pending amount", 422, "PAYMENT_EXCEEDS_PENDING", {
        pending: currentPending
      });
    }

    const newPaid = data.writeOff ? currentPaid : currentPaid + amount;
    const paymentStatus = data.writeOff
      ? "Write Off"
      : derivePaymentStatus(pickup.totalValue, newPaid);
    const newPickup = {
      ...pickup,
      amountPaid: newPaid,
      paymentStatus
    };
    const paymentRef = paymentsCollection(pickup.id).doc();
    const payment = {
      id: paymentRef.id,
      ...paymentPayload({
        pickup,
        partnerId,
        amount,
        data,
        actor,
        cumulative: newPaid
      })
    };

    tx.set(paymentRef, payment);
    tx.set(pickupRef, cleanUndefined({
      amountPaid: newPaid,
      paymentStatus,
      payHistory: [...(pickup.payHistory || []), paymentHistoryEntry(payment)]
    }), { merge: true });
    tx.set(partnerRef, {
      amountReceived: increment(data.writeOff ? 0 : amount),
      pendingAmount: increment(data.writeOff ? -currentPending : -amount),
      transactions: updatePartnerTransactions(partner.transactions || [], newPickup, paymentStatus)
    }, { merge: true });

    return {
      payment: {
        ...payment,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      pickup: newPickup
    };
  });
}

async function allocatePartnerPayment(partnerId, data, actor) {
  const amountToApply = toNumber(data.amount);
  if (amountToApply <= 0) {
    throw new AppError("Payment amount must be greater than zero", 422, "INVALID_PAYMENT_AMOUNT");
  }

  return db.runTransaction(async (tx) => {
    const partnerRef = partnersCollection().doc(partnerId);
    const partnerDoc = await tx.get(partnerRef);
    if (!partnerDoc.exists) throw new AppError("Pickup partner not found", 404, "PICKUP_PARTNER_NOT_FOUND");

    const unpaidQuery = pickupsCollection()
      .where("partnerId", "==", partnerId)
      .where("paymentStatus", "in", ["Not Paid", "Partially Paid"]);
    const unpaidSnapshot = await tx.get(unpaidQuery);
    const unpaidPickups = fromSnapshot(unpaidSnapshot)
      .filter((pickup) => pickupPendingAmount(pickup) > 0)
      .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));

    let remaining = amountToApply;
    const partner = fromDoc(partnerDoc);
    let transactions = partner.transactions || [];
    const payments = [];

    for (const pickup of unpaidPickups) {
      if (remaining <= 0) break;

      const applyAmount = Math.min(remaining, pickupPendingAmount(pickup));
      remaining -= applyAmount;

      const newPaid = toNumber(pickup.amountPaid) + applyAmount;
      const paymentStatus = derivePaymentStatus(pickup.totalValue, newPaid);
      const newPickup = { ...pickup, amountPaid: newPaid, paymentStatus };
      const paymentRef = paymentsCollection(pickup.id).doc();
      const payment = {
        id: paymentRef.id,
        ...paymentPayload({
          pickup,
          partnerId,
          amount: applyAmount,
          data,
          actor,
          cumulative: newPaid
        })
      };

      payments.push(payment);
      transactions = updatePartnerTransactions(transactions, newPickup, paymentStatus);
      tx.set(paymentRef, payment);
      tx.set(pickupsCollection().doc(pickup.id), {
        amountPaid: newPaid,
        paymentStatus,
        payHistory: [...(pickup.payHistory || []), paymentHistoryEntry(payment)]
      }, { merge: true });
    }

    const applied = amountToApply - remaining;
    if (applied <= 0) {
      throw new AppError("No pending pickups found for this partner", 422, "NO_PENDING_PICKUPS");
    }

    tx.set(partnerRef, {
      amountReceived: increment(applied),
      pendingAmount: increment(-applied),
      transactions
    }, { merge: true });

    return {
      applied,
      unapplied: remaining,
      payments: payments.map((payment) => ({
        ...payment,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))
    };
  });
}

async function recordPartnerPayment(partnerId, data, actor) {
  if (data.pickupId) {
    return recordSinglePickupPayment(partnerId, data, actor);
  }
  return allocatePartnerPayment(partnerId, data, actor);
}

async function clearPartnerBalance(partnerId, data, actor) {
  return db.runTransaction(async (tx) => {
    const partnerRef = partnersCollection().doc(partnerId);
    const partnerDoc = await tx.get(partnerRef);
    if (!partnerDoc.exists) throw new AppError("Pickup partner not found", 404, "PICKUP_PARTNER_NOT_FOUND");

    const unpaidQuery = pickupsCollection()
      .where("partnerId", "==", partnerId)
      .where("paymentStatus", "in", ["Not Paid", "Partially Paid"]);
    const unpaidSnapshot = await tx.get(unpaidQuery);
    const pickups = fromSnapshot(unpaidSnapshot).filter((pickup) => pickupPendingAmount(pickup) > 0);

    const partner = fromDoc(partnerDoc);
    let transactions = partner.transactions || [];
    let totalCleared = 0;
    const payments = [];

    for (const pickup of pickups) {
      const pending = pickupPendingAmount(pickup);
      const amount = data.writeOff ? 0 : pending;
      const newPaid = data.writeOff ? toNumber(pickup.amountPaid) : toNumber(pickup.amountPaid) + pending;
      const paymentStatus = data.writeOff ? "Write Off" : "Paid";
      const newPickup = { ...pickup, amountPaid: newPaid, paymentStatus };
      const paymentRef = paymentsCollection(pickup.id).doc();
      const payment = {
        id: paymentRef.id,
        ...paymentPayload({
          pickup,
          partnerId,
          amount,
          data,
          actor,
          cumulative: newPaid
        })
      };

      totalCleared += pending;
      payments.push(payment);
      transactions = updatePartnerTransactions(transactions, newPickup, paymentStatus);
      tx.set(paymentRef, payment);
      tx.set(pickupsCollection().doc(pickup.id), {
        amountPaid: newPaid,
        paymentStatus,
        payHistory: [...(pickup.payHistory || []), paymentHistoryEntry(payment)]
      }, { merge: true });
    }

    tx.set(partnerRef, {
      amountReceived: increment(data.writeOff ? 0 : totalCleared),
      pendingAmount: increment(-totalCleared),
      transactions
    }, { merge: true });

    return {
      cleared: totalCleared,
      writeOff: data.writeOff === true,
      payments: payments.map((payment) => ({
        ...payment,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))
    };
  });
}

module.exports = {
  paymentsCollection,
  listPayments,
  getPickupPayments,
  recordPartnerPayment,
  clearPartnerBalance
};
