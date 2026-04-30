const { Router } = require("express");
const controller = require("../controllers/auth.controller");
const { validate } = require("../middleware/validate");
const { requireAuth, requireRoles } = require("../middleware/auth");
const { ROLES } = require("../config/roles");
const {
  loginSchema,
  refreshSchema,
  createAuthUserSchema,
  setRoleSchema
} = require("../validators/auth.validators");

const router = Router();

router.post("/login", validate(loginSchema), controller.login);
router.post("/refresh", validate(refreshSchema), controller.refresh);
router.get("/me", requireAuth, controller.me);
router.post("/logout", requireAuth, controller.logout);
router.post("/users", requireAuth, requireRoles(ROLES.ADMIN), validate(createAuthUserSchema), controller.createAuthUser);
router.patch("/users/:uid/role", requireAuth, requireRoles(ROLES.ADMIN), validate(setRoleSchema), controller.setRole);

module.exports = router;
