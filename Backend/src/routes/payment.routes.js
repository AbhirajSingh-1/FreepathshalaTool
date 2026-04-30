const { Router } = require("express");
const controller = require("../controllers/payment.controller");
const { validate } = require("../middleware/validate");
const { requireAuth, requireRoles } = require("../middleware/auth");
const { ROLES } = require("../config/roles");
const {
  recordPaymentSchema,
  clearBalanceSchema,
  paymentListSchema
} = require("../validators/payment.validators");

const router = Router();

router.use(requireAuth);
router.get("/", requireRoles(ROLES.ADMIN, ROLES.MANAGER), validate(paymentListSchema), controller.list);
router.get("/pickups/:pickupId", requireRoles(ROLES.ADMIN, ROLES.MANAGER), controller.getPickupPayments);
router.post("/partners/:partnerId/record", requireRoles(ROLES.ADMIN, ROLES.MANAGER), validate(recordPaymentSchema), controller.record);
router.post("/partners/:partnerId/clear-balance", requireRoles(ROLES.ADMIN, ROLES.MANAGER), validate(clearBalanceSchema), controller.clearBalance);

module.exports = router;
