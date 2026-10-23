const TYPES = {
  GC: "general_contractor",
  SUB: "subcontractor",
  WORK: "find_work",
};

function roleFromContractorType(type) {
  if (type === TYPES.GC) return "business";
  if (type === TYPES.SUB || type === TYPES.WORK) return "provider";
  return "business";
}

function accountKind(user) {
  if (!user) return "guest";
  if (user.role === "admin") return "admin";
  if (user.contractorType === TYPES.GC) return "contractor";
  return "worker";
}

function buildPermissions(user) {
  const kind = accountKind(user);
  const admin = kind === "admin";
  const isSub = user.contractorType === TYPES.SUB;
  const contractor = admin || kind === "contractor";
  // Subcontractors post trade work packages too, and can bid on others' jobs.
  const poster = contractor || isSub;
  const worker = admin || kind === "worker";

  return {
    postProjects: poster,
    manageProjects: poster,
    hire: poster,
    inviteContractors: poster,
    manageTeam: contractor,
    applyToJobs: worker,
    browseJobs: true,
    message: true,
    viewContractors: true,
    saveContractors: true,
    billing: true,
    settings: true,
  };
}

function can(user, permission) {
  if (!user) return false;
  return Boolean(buildPermissions(user)[permission]);
}

function authorizePermission(...keys) {
  return (req, res, next) => {
    const perms = req.permissions || buildPermissions(req.user);
    if (keys.some((key) => perms[key])) return next();
    return res.status(403).json({
      success: false,
      message: "Your account type cannot do this.",
    });
  };
}

module.exports = {
  TYPES,
  roleFromContractorType,
  accountKind,
  buildPermissions,
  can,
  authorizePermission,
};
