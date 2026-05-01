const { db } = require("../config/firebase");
const { COLLECTIONS } = require("../config/collections");
const { fromSnapshot, auditCreate, auditUpdate, cleanUndefined } = require("../utils/firestore");

function normalizeName(value) {
  return String(value || "").trim();
}

function slugify(value) {
  return normalizeName(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function cityRef(city) {
  return db.collection(COLLECTIONS.CITIES).doc(slugify(city));
}

function sectorRef(city, sector) {
  return db.collection(COLLECTIONS.SECTORS).doc(`${slugify(city)}__${slugify(sector)}`);
}

function societyRef(city, sector, society) {
  return db.collection(COLLECTIONS.SOCIETIES).doc(`${slugify(city)}__${slugify(sector)}__${slugify(society)}`);
}

function buildCity(city, actor) {
  return cleanUndefined({
    id: slugify(city),
    name: normalizeName(city),
    normalizedName: normalizeName(city).toLowerCase(),
    ...auditCreate(actor),
    ...auditUpdate(actor)
  });
}

function buildSector(city, sector, actor) {
  return cleanUndefined({
    id: `${slugify(city)}__${slugify(sector)}`,
    name: normalizeName(sector),
    normalizedName: normalizeName(sector).toLowerCase(),
    city: normalizeName(city),
    cityId: slugify(city),
    ...auditCreate(actor),
    ...auditUpdate(actor)
  });
}

function buildSociety(city, sector, society, actor) {
  return cleanUndefined({
    id: `${slugify(city)}__${slugify(sector)}__${slugify(society)}`,
    name: normalizeName(society),
    normalizedName: normalizeName(society).toLowerCase(),
    city: normalizeName(city),
    cityId: slugify(city),
    sector: normalizeName(sector),
    sectorId: `${slugify(city)}__${slugify(sector)}`,
    ...auditCreate(actor),
    ...auditUpdate(actor)
  });
}

function setLocationDocs(writer, location, actor) {
  const city = normalizeName(location.city);
  const sector = normalizeName(location.sector);
  const society = normalizeName(location.society);

  if (!city) return;

  writer.set(cityRef(city), buildCity(city, actor), { merge: true });
  if (sector) writer.set(sectorRef(city, sector), buildSector(city, sector, actor), { merge: true });
  if (sector && society) writer.set(societyRef(city, sector, society), buildSociety(city, sector, society, actor), { merge: true });
}

async function upsertLocationHierarchy(location, actor, tx = null) {
  if (tx) {
    setLocationDocs(tx, location, actor);
    return;
  }

  const batch = db.batch();
  setLocationDocs(batch, location, actor);
  await batch.commit();
}

async function upsertLocationsFromPayload(payload, actor, tx = null) {
  const city = normalizeName(payload.city);

  await upsertLocationHierarchy({
    city,
    sector: payload.sector,
    society: payload.society
  }, actor, tx);

  const sectors = Array.isArray(payload.sectors) ? payload.sectors : [];
  const societies = Array.isArray(payload.societies) ? payload.societies : [];

  if (tx) {
    sectors.forEach((sector) => setLocationDocs(tx, { city, sector }, actor));
    if (sectors.length === 1) {
      societies.forEach((society) => setLocationDocs(tx, { city, sector: sectors[0], society }, actor));
    }
    return;
  }

  if (city && (sectors.length || societies.length)) {
    const batch = db.batch();
    sectors.forEach((sector) => setLocationDocs(batch, { city, sector }, actor));
    if (sectors.length === 1) {
      societies.forEach((society) => setLocationDocs(batch, { city, sector: sectors[0], society }, actor));
    }
    await batch.commit();
  }
}

async function listCities() {
  const snapshot = await db.collection(COLLECTIONS.CITIES).get();
  return fromSnapshot(snapshot).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Natural sorting function for sector names.
 * Handles both numbered sectors (Sector 1, Sector 2, etc.) and named localities (DLF Phase 1, etc.)
 * Numbered sectors sort by number: Sector 1, Sector 2, ... Sector 10, Sector 11, ...
 * Named localities sort alphabetically after numbered sectors.
 */
function sortSectorsNatural(a, b) {
  const nameA = a.name || "";
  const nameB = b.name || "";

  // Extract numeric suffix using regex for patterns like "Sector 1", "Sector 10A", "DLF Phase 2"
  const numMatchA = nameA.match(/^.*?(\d+)\s*(.*)$/);
  const numMatchB = nameB.match(/^.*?(\d+)\s*(.*)$/);

  // If both have numeric suffixes, compare numerically
  if (numMatchA && numMatchB) {
    const numA = parseInt(numMatchA[1], 10);
    const numB = parseInt(numMatchB[1], 10);

    // If base numbers are different, sort by number
    if (numA !== numB) {
      return numA - numB;
    }

    // If base numbers are same, sort by any suffix (e.g., "A" < "B")
    const suffixA = numMatchA[2] || "";
    const suffixB = numMatchB[2] || "";
    return suffixA.localeCompare(suffixB);
  }

  // Fall back to alphabetical sorting for non-numbered sectors
  return nameA.localeCompare(nameB);
}

async function listSectors(city) {
  let query = db.collection(COLLECTIONS.SECTORS);
  if (city) query = query.where("cityId", "==", slugify(city));
  const snapshot = await query.get();
  return fromSnapshot(snapshot).sort(sortSectorsNatural);
}

async function listSocieties({ city, sector } = {}) {
  let query = db.collection(COLLECTIONS.SOCIETIES);
  if (city) query = query.where("cityId", "==", slugify(city));
  if (city && sector) query = query.where("sectorId", "==", `${slugify(city)}__${slugify(sector)}`);
  const snapshot = await query.get();
  return fromSnapshot(snapshot).sort((a, b) => a.name.localeCompare(b.name));
}

async function getLocationTree() {
  const [cities, sectors, societies] = await Promise.all([
    listCities(),
    listSectors(),
    listSocieties()
  ]);

  const citySectors = {};
  const sectorSocieties = {};

  cities.forEach((city) => {
    citySectors[city.name] = [];
  });

  sectors.forEach((sector) => {
    if (!citySectors[sector.city]) citySectors[sector.city] = [];
    citySectors[sector.city].push(sector.name);
    sectorSocieties[`${sector.city}::${sector.name}`] = [];
  });

  societies.forEach((society) => {
    const key = `${society.city}::${society.sector}`;
    if (!sectorSocieties[key]) sectorSocieties[key] = [];
    sectorSocieties[key].push(society.name);
  });

  return {
    cities,
    sectors,
    societies,
    citySectors,
    sectorSocieties
  };
}

async function deleteCity(id) {
  await db.collection(COLLECTIONS.CITIES).doc(id).delete();
}

async function deleteSector(id) {
  await db.collection(COLLECTIONS.SECTORS).doc(id).delete();
}

async function deleteSociety(id) {
  await db.collection(COLLECTIONS.SOCIETIES).doc(id).delete();
}

module.exports = {
  slugify,
  upsertLocationHierarchy,
  upsertLocationsFromPayload,
  listCities,
  listSectors,
  listSocieties,
  getLocationTree,
  deleteCity,
  deleteSector,
  deleteSociety
};

