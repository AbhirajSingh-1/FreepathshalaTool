const { z, optionalString } = require("./common.validators");

const locationQuerySchema = z.object({
  query: z.object({
    city: optionalString,
    sector: optionalString
  }).default({})
});

const upsertLocationSchema = z.object({
  body: z.object({
    city: z.string().min(1),
    sector: optionalString,
    society: optionalString
  })
});

module.exports = {
  locationQuerySchema,
  upsertLocationSchema
};
