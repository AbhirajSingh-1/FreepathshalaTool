const { z, role, optionalString } = require("./common.validators");

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6)
  })
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1)
  })
});

const createAuthUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(1),
    role: role.default("executive"),
    phone: optionalString,
    active: z.boolean().default(true)
  })
});

const setRoleSchema = z.object({
  params: z.object({
    uid: z.string().min(1)
  }),
  body: z.object({
    role
  })
});

module.exports = {
  loginSchema,
  refreshSchema,
  createAuthUserSchema,
  setRoleSchema
};
