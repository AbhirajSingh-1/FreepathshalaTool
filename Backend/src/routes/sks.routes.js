const { Router } = require("express");
const controller = require("../controllers/sks.controller");
const { validate } = require("../middleware/validate");
const { requireAuth, requireRoles } = require("../middleware/auth");
const { ROLES } = require("../config/roles");
const { idParam, listQuery } = require("../validators/common.validators");
const {
  createSksInflowSchema,
  createSksOutflowSchema
} = require("../validators/sks.validators");

const router = Router();

router.use(requireAuth);
router.get("/stock", validate(listQuery), controller.getStock);
router.get("/inflows", validate(listQuery), controller.listInflows);
router.post("/inflows", requireRoles(ROLES.ADMIN, ROLES.MANAGER, ROLES.EXECUTIVE), validate(createSksInflowSchema), controller.createInflow);
router.delete("/inflows/:id", requireRoles(ROLES.ADMIN, ROLES.MANAGER), validate(idParam), controller.deleteInflow);
router.get("/outflows", validate(listQuery), controller.listOutflows);
router.post("/outflows", requireRoles(ROLES.ADMIN, ROLES.MANAGER, ROLES.EXECUTIVE), validate(createSksOutflowSchema), controller.createOutflow);
router.delete("/outflows/:id", requireRoles(ROLES.ADMIN, ROLES.MANAGER), validate(idParam), controller.deleteOutflow);

module.exports = router;
