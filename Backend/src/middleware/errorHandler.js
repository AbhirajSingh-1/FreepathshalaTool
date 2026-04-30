const { AppError } = require("../utils/AppError");
const { sendError } = require("../utils/response");
const { logger } = require("../config/logger");

function notFoundHandler(req, _res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, "NOT_FOUND"));
}

function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || (error.name === "MulterError" ? 400 : 500);
  const appError = error instanceof AppError
    ? error
    : new AppError(
      statusCode === 500 ? "Something went wrong" : error.message,
      statusCode,
      error.code || (statusCode === 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR")
    );

  logger.error(appError.message, {
    code: appError.code,
    statusCode: appError.statusCode,
    stack: appError.stack
  });

  sendError(res, appError);
}

module.exports = {
  notFoundHandler,
  errorHandler
};
