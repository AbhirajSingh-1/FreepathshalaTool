const {
  z,
  optionalString,
  dateString
} = require("./common.validators");

const item = z.object({
  name: z.string().min(1),
  qty: z.coerce.number().min(0),
  unit: optionalString,
  notes: optionalString
}).passthrough();

const inflowBase = z.object({
  donorId: optionalString,
  donorName: optionalString,
  pickupId: optionalString,
  date: dateString,
  source: optionalString,
  items: z.array(item).min(1),
  notes: optionalString
}).passthrough();

const outflowBase = z.object({
  partnerName: z.string().min(1),
  partnerPhone: optionalString,
  date: dateString,
  items: z.array(item).min(1),
  payment: z.any().optional(),
  notes: optionalString
}).passthrough();

const createSksInflowSchema = z.object({ body: inflowBase });
const createSksOutflowSchema = z.object({ body: outflowBase });

module.exports = {
  createSksInflowSchema,
  createSksOutflowSchema
};
