const pickupService = require("../services/pickup.service");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");

const list = asyncHandler(async (req, res) => {
  const data = await pickupService.listPickups(req.query);
  sendSuccess(res, data, "Pickups fetched");
});

const listRaddiRecords = asyncHandler(async (req, res) => {
  const data = await pickupService.listRaddiRecords(req.query);
  sendSuccess(res, data, "Raddi records fetched");
});

const get = asyncHandler(async (req, res) => {
  const data = await pickupService.getPickup(req.params.id);
  sendSuccess(res, data, "Pickup fetched");
});

const create = asyncHandler(async (req, res) => {
  const data = await pickupService.createPickup(req.body, req.user);
  sendSuccess(res, data, "Pickup created", 201);
});

const update = asyncHandler(async (req, res) => {
  const data = await pickupService.updatePickup(req.params.id, req.body, req.user);
  sendSuccess(res, data, "Pickup updated");
});

const record = asyncHandler(async (req, res) => {
  const data = await pickupService.recordPickup(req.params.id, req.body, req.user);
  sendSuccess(res, data, "Pickup recorded");
});

const remove = asyncHandler(async (req, res) => {
  const data = await pickupService.deletePickup(req.params.id);
  sendSuccess(res, data, "Pickup deleted");
});

module.exports = {
  list,
  listRaddiRecords,
  get,
  create,
  update,
  record,
  remove
};
