const { Router } = require("express");
const controller = require("../controllers/dashboard.controller");
const { requireAuth, requireRoles } = require("../middleware/auth");
const { ROLES } = require("../config/roles");
const { validate } = require("../middleware/validate");
const { listQuery } = require("../validators/common.validators");

const router = Router();

router.use(requireAuth);
router.get("/stats", requireRoles(ROLES.ADMIN, ROLES.MANAGER), validate(listQuery), controller.stats);
router.get("/scheduler", requireRoles(ROLES.ADMIN, ROLES.MANAGER), controller.scheduler);

module.exports = router;
