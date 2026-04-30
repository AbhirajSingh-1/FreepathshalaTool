const { auth, db } = require("../config/firebase");
const { env } = require("../config/env");
const { COLLECTIONS } = require("../config/collections");
const { AppError } = require("../utils/AppError");
const { fromDoc, auditCreate, auditUpdate } = require("../utils/firestore");

async function firebaseAuthRequest(endpoint, body, secureToken = false) {
  if (!env.firebaseWebApiKey) {
    throw new AppError("FIREBASE_WEB_API_KEY is required for password login through the backend", 500, "AUTH_CONFIG_MISSING");
  }

  const baseUrl = secureToken
    ? "https://securetoken.googleapis.com/v1"
    : "https://identitytoolkit.googleapis.com/v1";
  const url = `${baseUrl}/${endpoint}?key=${env.firebaseWebApiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": secureToken
        ? "application/x-www-form-urlencoded"
        : "application/json"
    },
    body: secureToken
      ? new URLSearchParams(body).toString()
      : JSON.stringify(body)
  });

  const payload = await response.json();
  if (!response.ok) {
    const code = payload?.error?.message || "AUTH_REQUEST_FAILED";
    throw new AppError("Authentication failed", 401, code);
  }

  return payload;
}

async function getProfile(uid) {
  const userRecord = await auth.getUser(uid);
  const userDoc = await db.collection(COLLECTIONS.USERS).doc(uid).get();
  const customClaims = userRecord.customClaims || {};

  return {
    uid,
    email: userRecord.email,
    name: userRecord.displayName || fromDoc(userDoc)?.name || "",
    role: customClaims.role || fromDoc(userDoc)?.role || "executive",
    disabled: userRecord.disabled,
    profile: fromDoc(userDoc)
  };
}

async function login({ email, password }) {
  const session = await firebaseAuthRequest("accounts:signInWithPassword", {
    email,
    password,
    returnSecureToken: true
  });

  const decoded = await auth.verifyIdToken(session.idToken);
  const profile = await getProfile(decoded.uid);

  return {
    idToken: session.idToken,
    refreshToken: session.refreshToken,
    expiresIn: Number(session.expiresIn),
    user: profile
  };
}

async function refresh(refreshToken) {
  const refreshed = await firebaseAuthRequest("token", {
    grant_type: "refresh_token",
    refresh_token: refreshToken
  }, true);

  const decoded = await auth.verifyIdToken(refreshed.id_token);
  const profile = await getProfile(decoded.uid);

  return {
    idToken: refreshed.id_token,
    refreshToken: refreshed.refresh_token,
    expiresIn: Number(refreshed.expires_in),
    user: profile
  };
}

async function revokeRefreshTokens(uid) {
  await auth.revokeRefreshTokens(uid);
  return { uid, revoked: true };
}

async function createAuthUser(data, actor) {
  const userRecord = await auth.createUser({
    email: data.email,
    password: data.password,
    displayName: data.name,
    phoneNumber: data.phone || undefined,
    disabled: data.active === false
  });

  await auth.setCustomUserClaims(userRecord.uid, { role: data.role });

  const profile = {
    id: userRecord.uid,
    uid: userRecord.uid,
    email: data.email,
    name: data.name,
    phone: data.phone || "",
    role: data.role,
    active: data.active !== false,
    ...auditCreate(actor)
  };

  await db.collection(COLLECTIONS.USERS).doc(userRecord.uid).set(profile, { merge: true });
  return getProfile(userRecord.uid);
}

async function setRole(uid, role, actor) {
  await auth.setCustomUserClaims(uid, { role });
  await db.collection(COLLECTIONS.USERS).doc(uid).set({
    uid,
    role,
    ...auditUpdate(actor)
  }, { merge: true });
  return getProfile(uid);
}

async function forgotPassword(email) {
  if (!env.firebaseWebApiKey) {
    throw new AppError("FIREBASE_WEB_API_KEY is required", 500, "AUTH_CONFIG_MISSING");
  }
  // Use Firebase Identity Toolkit to send password reset email
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${env.firebaseWebApiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestType: "PASSWORD_RESET", email })
  });
  const payload = await response.json();
  if (!response.ok) {
    const code = payload?.error?.message || "RESET_FAILED";
    if (code === "EMAIL_NOT_FOUND") {
      // Don't reveal whether email exists — silently succeed
      return { sent: true };
    }
    throw new AppError("Failed to send reset email", 400, code);
  }
  return { sent: true };
}

async function changePassword(uid, { currentPassword, newPassword }) {
  // Verify the user exists
  const userRecord = await auth.getUser(uid);
  if (!userRecord.email) {
    throw new AppError("User has no email address", 400, "NO_EMAIL");
  }

  // Re-authenticate with current password to verify identity
  try {
    await firebaseAuthRequest("accounts:signInWithPassword", {
      email: userRecord.email,
      password: currentPassword,
      returnSecureToken: false
    });
  } catch {
    throw new AppError("Current password is incorrect", 401, "WRONG_PASSWORD");
  }

  // Update password via Admin SDK
  await auth.updateUser(uid, { password: newPassword });
  return { uid, passwordChanged: true };
}

module.exports = {
  login,
  refresh,
  getProfile,
  revokeRefreshTokens,
  createAuthUser,
  setRole,
  forgotPassword,
  changePassword
};
