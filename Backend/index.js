const { onRequest } = require("firebase-functions/v2/https");
const app = require("./src/app");
const { env } = require("./src/config/env");

exports.api = onRequest(
  {
    region: env.functionRegion,
    cors: false,
    timeoutSeconds: 60,
    memory: "512MiB"
  },
  app
);
