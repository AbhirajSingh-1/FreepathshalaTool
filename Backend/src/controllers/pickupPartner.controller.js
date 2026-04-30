const partnerService = require("../services/pickupPartner.service");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");

const list = asyncHandler(async (req, res) => {
  const data = await partnerService.listPickupPartners(req.query);
  sendSuccess(res, data, "Pickup partners fetched");
});

const get = asyncHandler(async (req, res) => {
  const data = await partnerService.getPickupPartner(req.params.id);
  sendSuccess(res, data, "Pickup partner fetched");
});

const create = asyncHandler(async (req, res) => {
  const data = await partnerService.createPickupPartner(req.body, req.user);
  sendSuccess(res, data, "Pickup partner created", 201);
});

const update = asyncHandler(async (req, res) => {
  const data = await partnerService.updatePickupPartner(req.params.id, req.body, req.user);
  sendSuccess(res, data, "Pickup partner updated");
});

const remove = asyncHandler(async (req, res) => {
  const data = await partnerService.deletePickupPartner(req.params.id);
  sendSuccess(res, data, "Pickup partner deleted");
});

module.exports = {
  list,
  get,
  create,
  update,
  remove
};
