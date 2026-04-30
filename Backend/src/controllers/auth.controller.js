const authService = require("../services/auth.service");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");

const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body);
  sendSuccess(res, data, "Logged in");
});

const refresh = asyncHandler(async (req, res) => {
  const data = await authService.refresh(req.body.refreshToken);
  sendSuccess(res, data, "Token refreshed");
});

const me = asyncHandler(async (req, res) => {
  const data = await authService.getProfile(req.user.uid);
  sendSuccess(res, data, "Current user");
});

const logout = asyncHandler(async (req, res) => {
  const data = await authService.revokeRefreshTokens(req.user.uid);
  sendSuccess(res, data, "Refresh tokens revoked");
});

const createAuthUser = asyncHandler(async (req, res) => {
  const data = await authService.createAuthUser(req.body, req.user);
  sendSuccess(res, data, "User created", 201);
});

const setRole = asyncHandler(async (req, res) => {
  const data = await authService.setRole(req.params.uid, req.body.role, req.user);
  sendSuccess(res, data, "Role updated");
});

module.exports = {
  login,
  refresh,
  me,
  logout,
  createAuthUser,
  setRole
};
