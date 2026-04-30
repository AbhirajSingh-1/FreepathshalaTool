const { randomUUID } = require("crypto");
const { getBucket } = require("../config/firebase");
const { env } = require("../config/env");
const { sanitizeFileName, sanitizePathSegment } = require("../utils/sanitize");

function buildStoragePath({ purpose = "general", entityId = "general", fileName }) {
  return [
    sanitizePathSegment(purpose),
    sanitizePathSegment(entityId || "general"),
    `${Date.now()}-${randomUUID()}-${sanitizeFileName(fileName)}`
  ].join("/");
}

function expiresAt() {
  return Date.now() + env.signedUrlTtlMinutes * 60 * 1000;
}

async function createReadSignedUrl(storagePath) {
  const [url] = await getBucket().file(storagePath).getSignedUrl({
    version: "v4",
    action: "read",
    expires: expiresAt()
  });
  return {
    storagePath,
    signedUrl: url,
    expiresAt: new Date(expiresAt()).toISOString()
  };
}

async function createWriteSignedUrl({ fileName, contentType, purpose, entityId }) {
  const storagePath = buildStoragePath({ purpose, entityId, fileName });
  const [url] = await getBucket().file(storagePath).getSignedUrl({
    version: "v4",
    action: "write",
    expires: expiresAt(),
    contentType
  });

  return {
    storagePath,
    signedUrl: url,
    method: "PUT",
    contentType,
    expiresAt: new Date(expiresAt()).toISOString()
  };
}

async function uploadFile({ file, purpose, entityId, user }) {
  const storagePath = buildStoragePath({
    purpose,
    entityId,
    fileName: file.originalname
  });
  const fileRef = getBucket().file(storagePath);

  await fileRef.save(file.buffer, {
    resumable: false,
    metadata: {
      contentType: file.mimetype,
      metadata: {
        originalName: file.originalname,
        uploadedBy: user?.uid || "system"
      }
    }
  });

  const read = await createReadSignedUrl(storagePath);
  return {
    storagePath,
    fileName: file.originalname,
    contentType: file.mimetype,
    size: file.size,
    signedUrl: read.signedUrl,
    expiresAt: read.expiresAt
  };
}

module.exports = {
  createReadSignedUrl,
  createWriteSignedUrl,
  uploadFile
};
