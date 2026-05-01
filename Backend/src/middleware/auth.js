const { auth, db } = require("../config/firebase");
const { COLLECTIONS } = require("../config/collections");
const { AppError } = require("../utils/AppError");
const { logger } = require("../config/logger");

/**
 * Middleware that verifies the Firebase ID token from the Authorization header
 * and attaches user info (uid, email, role, claims) to req.user.
 *
 * Role resolution order:
 *   1. Custom claim `role` from the ID token (fastest, no DB call)
 *   2. Firestore users/{uid}.role (fallback, covers the window after
 *      custom claims are set but the token hasn't been refreshed yet)
 *   3. Default: "executive"
 */
async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || "";
    const [, token] = header.match(/^Bearer\s+(.+)$/i) || [];

    if (!token) {
      throw new AppError("Missing Bearer token", 401, "UNAUTHENTICATED");
    }

    // checkRevoked = true → rejects tokens whose refresh tokens have been revoked
    const decoded = await auth.verifyIdToken(token, true);

    // ── Resolve role ─────────────────────────────────────────
    let role = decoded.role || decoded.roles?.[0] || "";

    // Fallback: fetch from Firestore when the token doesn't carry a role yet.
    if (!role) {
      try {
        const userDoc = await db.collection(COLLECTIONS.USERS).doc(decoded.uid).get();
        if (userDoc.exists) {
          role = userDoc.data()?.role; // DO NOT DEFAULT TO EXECUTIVE HERE
        }
      } catch (dbErr) {
        logger.warn("Failed to fetch user role from Firestore", { uid: decoded.uid, error: dbErr.message });
      }
    }

    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
      role,
      claims: decoded
    };

    next();
  } catch (error) {
    next(error instanceof AppError
      ? error
      : new AppError("Invalid or expired token", 401, "UNAUTHENTICATED"));
  }
}

/**
 * Factory middleware that restricts access to users whose role is
 * in the provided allow-list.
 *
 * Usage: requireRoles(ROLES.ADMIN, ROLES.MANAGER)
 */
function requireRoles(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      next(new AppError("Authentication required", 401, "UNAUTHENTICATED"));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new AppError("You do not have permission to perform this action", 403, "FORBIDDEN", {
        requiredRoles: roles,
        currentRole: req.user.role
      }));
      return;
    }

    next();
  };
}

module.exports = {
  requireAuth,
  requireRoles
};
