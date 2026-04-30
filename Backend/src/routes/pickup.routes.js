const { Router } = require("express");
const controller = require("../controllers/pickup.controller");
const { validate } = require("../middleware/validate");
const { requireAuth, requireRoles } = require("../middleware/auth");
const { ROLES } = require("../config/roles");
const { idParam, listQuery } = require("../validators/common.validators");
const {
  createPickupSchema,
  updatePickupSchema,
  recordPickupSchema
} = require("../validators/pickup.validators");

const router = Router();

router.use(requireAuth);
router.get("/", validate(listQuery), controller.list);
router.get("/raddi-records", validate(listQuery), controller.listRaddiRecords);
router.post("/", requireRoles(ROLES.ADMIN, ROLES.MANAGER), validate(createPickupSchema), controller.create);
router.get("/:id", validate(idParam), controller.get);
router.patch("/:id", requireRoles(ROLES.ADMIN, ROLES.MANAGER, ROLES.EXECUTIVE), validate(updatePickupSchema), controller.update);
router.post("/:id/record", requireRoles(ROLES.ADMIN, ROLES.MANAGER, ROLES.EXECUTIVE), validate(recordPickupSchema), controller.record);
router.delete("/:id", requireRoles(ROLES.ADMIN), validate(idParam), controller.remove);

module.exports = router;
