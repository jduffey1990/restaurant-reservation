function requireRole(role) {
  return function (req, _res, next) {
    if (req.user && req.user.role === role) return next();
    next({ status: 403, message: `This action requires the ${role} role` });
  };
}

module.exports = requireRole;
