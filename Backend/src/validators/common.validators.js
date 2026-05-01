const { z } = require("zod");
const { ROLE_VALUES } = require("../config/roles");

const idParam = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});

const uidParam = z.object({
  params: z.object({
    uid: z.string().min(1)
  })
});

const listQuery = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(1000).optional(),
    status: z.string().optional(),
    city: z.string().optional(),
    sector: z.string().optional(),
    donorId: z.string().optional(),
    partnerId: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    q: z.string().optional()
  }).passthrough().default({})
});

const role = z.enum(ROLE_VALUES);

const optionalString = z.string().transform(val => (val && val.trim()) ? val.trim() : undefined).optional();
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal(""));
const stringArray = z.array(z.string()).default([]);
const amount = z.coerce.number().min(0).default(0);

module.exports = {
  z,
  idParam,
  uidParam,
  listQuery,
  role,
  optionalString,
  dateString,
  stringArray,
  amount
};
