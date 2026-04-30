const multer = require("multer");
const { env } = require("../config/env");
const { AppError } = require("../utils/AppError");

const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf"
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.maxUploadMb * 1024 * 1024,
    files: 1
  },
  fileFilter(_req, file, callback) {
    if (!allowedTypes.has(file.mimetype)) {
      callback(new AppError("Only JPEG, PNG, WebP, and PDF uploads are allowed", 415, "UNSUPPORTED_FILE_TYPE"));
      return;
    }
    callback(null, true);
  }
});

module.exports = { upload };
