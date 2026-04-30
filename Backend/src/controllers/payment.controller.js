const paymentService = require("../services/payment.service");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");

const list = asyncHandler(async (req, res) => {
  const data = await paymentService.listPayments(req.query);
  sendSuccess(res, data, "Payments fetched");
});

const getPickupPayments = asyncHandler(async (req, res) => {
  const data = await paymentService.getPickupPayments(req.params.pickupId);
  sendSuccess(res, data, "Pickup payments fetched");
});

const record = asyncHandler(async (req, res) => {
  const data = await paymentService.recordPartnerPayment(req.params.partnerId, req.body, req.user);
  sendSuccess(res, data, "Payment recorded", 201);
});

const clearBalance = asyncHandler(async (req, res) => {
  const data = await paymentService.clearPartnerBalance(req.params.partnerId, req.body, req.user);
  sendSuccess(res, data, "Partner balance cleared");
});

module.exports = {
  list,
  getPickupPayments,
  record,
  clearBalance
};
