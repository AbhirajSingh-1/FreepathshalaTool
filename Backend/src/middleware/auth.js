const { auth } = require("../config/firebase");
const { AppError } = require("../utils/AppError");

async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || "";
    const [, token] = header.match(/^Bearer\s+(.+)$/i) || [];

    if (!token) {
      throw new AppError("Missing Bearer token", 401, "UNAUTHENTICATED");
    }

    const decoded = await auth.verifyIdToken(token, true);
    const role = decoded.role || decoded.roles?.[0] || "executive";

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
