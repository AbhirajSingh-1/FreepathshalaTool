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
const { deriveDonorStatus, toNumber } = require("../utils/businessRules");
const { fetchCursorPage, listPayload } = require("../utils/query");
const {
  applyLocationFilters,
  invalidateLocationCache,
  locationSnapshot,
  upsertLocationsFromPayload
} = require("./location.service");

function donorsCollection() {
  return db.collection(COLLECTIONS.DONORS);
}

function applyDonorFilters(query, filters = {}) {
  if (filters.status) query = query.where("status", "==", filters.status);
  return applyLocationFilters(query, filters);
}

async function listDonors(filters = {}) {
  let query = donorsCollection();
  query = applyDonorFilters(query, filters);
  const page = await fetchCursorPage(query, {
    limit: filters.pageSize || filters.limit,
    defaultLimit: 100,
    maxLimit: 1000,
    cursor: filters.cursor,
    fields: filters.fields,
    orderBy: [{ field: "createdAt", direction: "desc" }]
  });
  let donors = page.records;

  // Re-derive status from lastPickup date on every fetch to keep it current
  donors = donors.map((donor) => ({
    ...donor,
    status: deriveDonorStatus(donor.lastPickup, donor.status)
  }));

  if (filters.q) {
    const needle = filters.q.toLowerCase();
    donors = donors.filter((donor) => [
      donor.name,
      donor.mobile,
      donor.society,
      donor.city
    ].some((value) => String(value || "").toLowerCase().includes(needle)));
  }

  return listPayload({ records: donors, pageInfo: page.pageInfo });
}

async function getDonor(id) {
  const doc = await donorsCollection().doc(id).get();
  const donor = fromDoc(doc);
  if (!donor) throw new AppError("Donor not found", 404, "DONOR_NOT_FOUND");
  return donor;
}

async function createDonor(data, actor) {
  const created = await db.runTransaction(async (tx) => {
    const id = data.id || await nextId("donors", tx);
    const ref = donorsCollection().doc(id);
    const payload = cleanUndefined({
      ...data,
      ...locationSnapshot(data),
      id,
      house: data.house || data.houseNo || "",
      status: data.status || deriveDonorStatus(data.lastPickup),
      totalRST: toNumber(data.totalRST),
      totalSKS: toNumber(data.totalSKS),
      donorType: data.donorType || "donor",
      lastPickup: data.lastPickup || null,
      nextPickup: data.nextPickup || null,
      ...auditCreate(actor)
    });

    tx.set(ref, payload);
    await upsertLocationsFromPayload(payload, actor, tx);
    return { ...payload, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  });

  invalidateLocationCache();
  return created;
}

async function updateDonor(id, data, actor) {
  const ref = donorsCollection().doc(id);
  const doc = await ref.get();
  if (!doc.exists) throw new AppError("Donor not found", 404, "DONOR_NOT_FOUND");

  const current = doc.data();
  const payload = cleanUndefined({
    ...data,
    ...locationSnapshot({ ...current, ...data }),
    house: data.house || data.houseNo || current.house || "",
    status: data.status || deriveDonorStatus(data.lastPickup || current.lastPickup, current.status),
    ...auditUpdate(actor)
  });

  await ref.set(payload, { merge: true });
  await upsertLocationsFromPayload({ ...current, ...payload }, actor);
  return getDonor(id);
}

async function deleteDonor(id) {
  const ref = donorsCollection().doc(id);
  const doc = await ref.get();
  if (!doc.exists) throw new AppError("Donor not found", 404, "DONOR_NOT_FOUND");
  await ref.delete();
  return { id, deleted: true };
}

module.exports = {
  donorsCollection,
  listDonors,
  getDonor,
  createDonor,
  updateDonor,
  deleteDonor
};
