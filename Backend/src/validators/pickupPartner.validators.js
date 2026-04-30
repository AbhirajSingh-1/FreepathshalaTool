const {
  z,
  optionalString,
  stringArray,
  amount
} = require("./common.validators");

const partnerBase = z.object({
  name: z.string().min(1),
  mobile: z.string().min(7).max(15),
  email: z.string().email().optional().or(z.literal("")),
  sectors: stringArray.optional(),
  societies: stringArray.optional(),
  area: optionalString,
  rating: z.coerce.number().min(0).max(5).optional(),
  totalPickups: amount.optional(),
  totalValue: amount.optional(),
  amountReceived: amount.optional(),
  pendingAmount: amount.optional(),
  rateChart: z.record(z.coerce.number()).optional(),
  transactions: z.array(z.any()).optional(),
  aadhaarDocument: z.any().optional(),
  active: z.boolean().optional()
}).passthrough();

const createPickupPartnerSchema = z.object({
  body: partnerBase
});

const updatePickupPartnerSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: partnerBase.partial()
});

module.exports = {
  createPickupPartnerSchema,
  updatePickupPartnerSchema
};
