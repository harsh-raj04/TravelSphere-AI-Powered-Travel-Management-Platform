const ROLE_HOME_ROUTES = {
  customer: '/',
  agent: '/agent/dashboard',
  admin: '/admin/dashboard',
};

const VARIANT_ALLOWED_ROLES = {
  customer: ['customer'],
  agent: ['agent'],
  admin: ['admin'],
};

export function normalizeRole(role) {
  return String(role || '').trim().toLowerCase();
}

export function getHomeRouteForRole(role) {
  const normalizedRole = normalizeRole(role);
  return ROLE_HOME_ROUTES[normalizedRole] || '/login';
}

export function hasAllowedRole(role, allowedRoles = []) {
  if (allowedRoles.length === 0) {
    return true;
  }

  const normalizedRole = normalizeRole(role);
  const normalizedAllowedRoles = allowedRoles.map((item) => normalizeRole(item));
  return normalizedAllowedRoles.includes(normalizedRole);
}

export function isRoleAllowedForVariant(role, variant) {
  const normalizedVariant = normalizeRole(variant);
  const allowedRoles = VARIANT_ALLOWED_ROLES[normalizedVariant];

  if (!allowedRoles) {
    return true;
  }

  return hasAllowedRole(role, allowedRoles);
}
