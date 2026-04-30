const { Router } = require("express");
const controller = require("../controllers/masterData.controller");
const { requireAuth } = require("../middleware/auth");

const router = Router();

router.use(requireAuth);
router.get("/", controller.get);

module.exports = router;
