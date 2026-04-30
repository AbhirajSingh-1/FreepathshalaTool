const { Router } = require("express");
const controller = require("../controllers/location.controller");
const { requireAuth, requireRoles } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { ROLES } = require("../config/roles");
const {
  locationQuerySchema,
  upsertLocationSchema
} = require("../validators/location.validators");

const router = Router();

router.use(requireAuth);
router.get("/tree", controller.tree);
router.get("/cities", controller.listCities);
router.get("/sectors", validate(locationQuerySchema), controller.listSectors);
router.get("/societies", validate(locationQuerySchema), controller.listSocieties);
router.post("/", requireRoles(ROLES.ADMIN, ROLES.MANAGER), validate(upsertLocationSchema), controller.upsert);

module.exports = router;
