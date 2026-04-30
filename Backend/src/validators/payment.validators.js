const {
  z,
  optionalString,
  dateString,
  amount
} = require("./common.validators");

const paymentBase = z.object({
  pickupId: optionalString,
  amount,
  refMode: z.string().default("cash"),
  refValue: optionalString,
  notes: optionalString,
  date: dateString,
  screenshot: z.any().optional(),
  writeOff: z.boolean().default(false)
}).passthrough();

const recordPaymentSchema = z.object({
  params: z.object({
    partnerId: z.string().min(1)
  }),
  body: paymentBase
});

const clearBalanceSchema = z.object({
  params: z.object({
    partnerId: z.string().min(1)
  }),
  body: z.object({
    refMode: z.string().default("cash"),
    refValue: optionalString,
    notes: optionalString,
    date: dateString,
    screenshot: z.any().optional(),
    writeOff: z.boolean().default(false)
  }).passthrough()
});

const paymentListSchema = z.object({
  query: z.object({
    pickupId: optionalString,
    partnerId: optionalString,
    dateFrom: optionalString,
    dateTo: optionalString,
    limit: z.coerce.number().int().min(1).max(200).optional()
  }).default({})
});

module.exports = {
  recordPaymentSchema,
  clearBalanceSchema,
  paymentListSchema
};
