const sksService = require("../services/sks.service");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");

const listInflows = asyncHandler(async (req, res) => {
  const data = await sksService.listInflows(req.query);
  sendSuccess(res, data, "SKS inflows fetched");
});

const listOutflows = asyncHandler(async (req, res) => {
  const data = await sksService.listOutflows(req.query);
  sendSuccess(res, data, "SKS outflows fetched");
});

const createInflow = asyncHandler(async (req, res) => {
  const data = await sksService.createInflow(req.body, req.user);
  sendSuccess(res, data, "SKS inflow created", 201);
});

const createOutflow = asyncHandler(async (req, res) => {
  const data = await sksService.createOutflow(req.body, req.user);
  sendSuccess(res, data, "SKS outflow created", 201);
});

const deleteInflow = asyncHandler(async (req, res) => {
  const data = await sksService.deleteInflow(req.params.id);
  sendSuccess(res, data, "SKS inflow deleted");
});

const deleteOutflow = asyncHandler(async (req, res) => {
  const data = await sksService.deleteOutflow(req.params.id);
  sendSuccess(res, data, "SKS outflow deleted");
});

const getStock = asyncHandler(async (_req, res) => {
  const data = await sksService.getStock();
  sendSuccess(res, data, "SKS stock fetched");
});

module.exports = {
  listInflows,
  listOutflows,
  createInflow,
  createOutflow,
  deleteInflow,
  deleteOutflow,
  getStock
};
