function authorize(...allowedRoles) {
  return (req, res, next) => {
    const userRole = String(req.user?.role || "").trim().toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map((role) => String(role || "").trim().toLowerCase());

    if (!userRole || !normalizedAllowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: insufficient permissions",
        errors: [],
      });
    }

    return next();
  };
}

module.exports = { authorize };
