const { auth, db } = require("../config/firebase");
const { COLLECTIONS } = require("../config/collections");
const { AppError } = require("../utils/AppError");
const { fromDoc, fromSnapshot, auditCreate, auditUpdate } = require("../utils/firestore");

function usersCollection() {
  return db.collection(COLLECTIONS.USERS);
}

async function listUsers({ limit = 100, role, active } = {}) {
  let query = usersCollection().orderBy("createdAt", "desc");
  if (role) query = query.where("role", "==", role);
  if (active !== undefined) query = query.where("active", "==", active);
  const snapshot = await query.limit(limit).get();
  return fromSnapshot(snapshot);
}

async function getUser(id) {
  const doc = await usersCollection().doc(id).get();
  const user = fromDoc(doc);
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
  return user;
}

async function createUser(data, actor) {
  let uid = data.firebaseUid;

  if (!uid) {
    if (!data.password) {
      throw new AppError("Password is required when creating a Firebase Auth user", 422, "PASSWORD_REQUIRED");
    }

    const userRecord = await auth.createUser({
      email: data.email,
      password: data.password,
      displayName: data.name,
      phoneNumber: data.phone || undefined,
      disabled: data.active === false
    });
    uid = userRecord.uid;
  }

  await auth.setCustomUserClaims(uid, { role: data.role });

  const payload = {
    id: uid,
    uid,
    email: data.email,
    name: data.name,
    phone: data.phone || "",
    role: data.role,
    active: data.active !== false,
    ...auditCreate(actor)
  };

  await usersCollection().doc(uid).set(payload, { merge: true });
  return getUser(uid);
}

async function updateUser(id, data, actor) {
  const ref = usersCollection().doc(id);
  const existing = await ref.get();
  if (!existing.exists) throw new AppError("User not found", 404, "USER_NOT_FOUND");

  const authPatch = {};
  if (data.name) authPatch.displayName = data.name;
  if (typeof data.active === "boolean") authPatch.disabled = !data.active;
  if (Object.keys(authPatch).length) await auth.updateUser(id, authPatch);
  if (data.role) await auth.setCustomUserClaims(id, { role: data.role });

  await ref.set({
    ...data,
    ...auditUpdate(actor)
  }, { merge: true });

  return getUser(id);
}

async function deleteUser(id) {
  await Promise.allSettled([
    auth.deleteUser(id),
    usersCollection().doc(id).delete()
  ]);
  return { id, deleted: true };
}

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
};
