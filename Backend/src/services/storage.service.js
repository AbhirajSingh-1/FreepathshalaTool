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

function createFirebaseDownloadUrl(bucketName, storagePath, token) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(storagePath)}?alt=media&token=${token}`;
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
  const bucket = getBucket();
  const storagePath = buildStoragePath({
    purpose,
    entityId,
    fileName: file.originalname
  });
  const fileRef = bucket.file(storagePath);
  const downloadToken = randomUUID();

  console.log(`[uploadFile] Attempting to upload ${file.originalname} to bucket ${bucket.name} at path ${storagePath}`);

  try {
    await fileRef.save(file.buffer, {
      resumable: false,
      metadata: {
        contentType: file.mimetype,
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
          originalName: file.originalname,
          uploadedBy: user?.uid || "system"
        }
      }
    });
    console.log(`[uploadFile] Successfully uploaded ${file.originalname} to ${storagePath}`);
  } catch (err) {
    console.error(`[uploadFile] Firebase Storage save error for ${storagePath}:`, err);
    throw err;
  }

  const downloadUrl = createFirebaseDownloadUrl(bucket.name, storagePath, downloadToken);

  return {
    storagePath,
    fileName: file.originalname,
    contentType: file.mimetype,
    size: file.size,
    url: downloadUrl,
    downloadUrl,
    signedUrl: downloadUrl,
    expiresAt: null,
    uploadedAt: new Date().toISOString()
  };
}

async function deleteFile(storagePath) {
  if (!storagePath) return false;
  try {
    await getBucket().file(storagePath).delete();
    return true;
  } catch (error) {
    if (error.code === 404) return false;
    throw error;
  }
}

module.exports = {
  createReadSignedUrl,
  createWriteSignedUrl,
  uploadFile,
  deleteFile
};
