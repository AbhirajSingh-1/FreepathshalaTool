const {
  z,
  optionalString,
  dateString,
  stringArray,
  amount
} = require("./common.validators");

const pickupBase = z.object({
  orderId: optionalString,
  donorId: optionalString,
  donorName: optionalString,
  mobile: optionalString,
  house: optionalString,
  houseNo: optionalString,
  society: optionalString,
  sector: optionalString,
  city: optionalString,
  partnerId: optionalString,
  PickupPartner: optionalString,
  pickupPartnerName: optionalString,
  pickuppartneradiMobile: optionalString,
  pickupPartnerMobile: optionalString,
  date: dateString,
  timeSlot: optionalString,
  status: z.string().default("Pending"),
  type: z.string().optional(),
  pickupMode: z.string().default("Individual"),
  rstItems: stringArray.optional(),
  sksItems: stringArray.optional(),
  sksItemDetails: z.record(z.any()).optional(),
  rstItemWeights: z.record(z.any()).optional(),
  rstOthers: z.array(z.any()).optional(),
  totalKgs: amount.optional(),
  totalKg: amount.optional(),
  totalValue: amount.optional(),
  amountPaid: amount.optional(),
  paymentStatus: z.string().optional(),
  nextDate: dateString,
  notes: optionalString,
  postponeReason: optionalString,
  lostReason: optionalString
}).passthrough();

const createPickupSchema = z.object({
  body: pickupBase
});

const updatePickupSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: pickupBase.partial()
});

const recordPickupSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: pickupBase.partial().extend({
    status: z.string().default("Completed")
  })
});

module.exports = {
  createPickupSchema,
  updatePickupSchema,
  recordPickupSchema
};
