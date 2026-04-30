const masterDataService = require("../services/masterData.service");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");

const get = asyncHandler(async (_req, res) => {
  const data = await masterDataService.getMasterData();
  sendSuccess(res, data, "Master data fetched");
});

module.exports = { get };
