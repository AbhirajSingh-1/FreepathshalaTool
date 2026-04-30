const { db } = require("../config/firebase");
const { COLLECTIONS } = require("../config/collections");
const { AppError } = require("../utils/AppError");
const { nextId } = require("../utils/idGenerator");
const {
  fromDoc,
  fromSnapshot,
  auditCreate,
  cleanUndefined
} = require("../utils/firestore");
const { derivePaymentStatus } = require("../utils/businessRules");

function inflowsCollection() {
  return db.collection(COLLECTIONS.SKS_INFLOWS);
}

function outflowsCollection() {
  return db.collection(COLLECTIONS.SKS_OUTFLOWS);
}

function applyListFilters(query, filters = {}) {
  if (filters.dateFrom) query = query.where("date", ">=", filters.dateFrom);
  if (filters.dateTo) query = query.where("date", "<=", filters.dateTo);
  return query;
}

async function listInflows(filters = {}) {
  const query = applyListFilters(inflowsCollection().orderBy("date", "desc"), filters);
  const snapshot = await query.limit(filters.limit || 100).get();
  return fromSnapshot(snapshot);
}

async function listOutflows(filters = {}) {
  const query = applyListFilters(outflowsCollection().orderBy("date", "desc"), filters);
  const snapshot = await query.limit(filters.limit || 100).get();
  return fromSnapshot(snapshot);
}

async function createInflow(data, actor) {
  return db.runTransaction(async (tx) => {
    const id = data.id || await nextId("sksInflows", tx);
    const ref = inflowsCollection().doc(id);
    const payload = cleanUndefined({
      ...data,
      id,
      date: data.date || new Date().toISOString().slice(0, 10),
      ...auditCreate(actor)
    });

    tx.set(ref, payload);
    return { ...payload, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  });
}

async function createOutflow(data, actor) {
  return db.runTransaction(async (tx) => {
    const id = data.id || await nextId("sksOutflows", tx);
    const ref = outflowsCollection().doc(id);
    const payment = data.payment
      ? {
        ...data.payment,
        status: data.payment.status || derivePaymentStatus(data.payment.totalValue, data.payment.amount)
      }
      : undefined;
    const payload = cleanUndefined({
      ...data,
      payment,
      id,
      date: data.date || new Date().toISOString().slice(0, 10),
      ...auditCreate(actor)
    });

    tx.set(ref, payload);
    return { ...payload, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  });
}

async function deleteInflow(id) {
  const ref = inflowsCollection().doc(id);
  const doc = await ref.get();
  if (!doc.exists) throw new AppError("SKS inflow not found", 404, "SKS_INFLOW_NOT_FOUND");
  await ref.delete();
  return { id, deleted: true };
}

async function deleteOutflow(id) {
  const ref = outflowsCollection().doc(id);
  const doc = await ref.get();
  if (!doc.exists) throw new AppError("SKS outflow not found", 404, "SKS_OUTFLOW_NOT_FOUND");
  await ref.delete();
  return { id, deleted: true };
}

function addItems(stock, items = [], direction) {
  for (const item of items) {
    const name = item.name;
    const qty = Number(item.qty) || 0;
    stock[name] = (stock[name] || 0) + direction * qty;
  }
}

async function getStock() {
  const [inflows, outflows] = await Promise.all([
    listInflows({ limit: 500 }),
    listOutflows({ limit: 500 })
  ]);

  const stock = {};
  inflows.forEach((entry) => addItems(stock, entry.items, 1));
  outflows.forEach((entry) => addItems(stock, entry.items, -1));

  return Object.entries(stock)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

module.exports = {
  listInflows,
  listOutflows,
  createInflow,
  createOutflow,
  deleteInflow,
  deleteOutflow,
  getStock
};
