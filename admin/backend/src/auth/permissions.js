// Kept in sync with backend/src/auth/permissions.js by hand — only the
// pieces the admin backend actually needs (accountKind/buildPermissions,
// used by publicAdminUser() and the protect middleware).
const TYPES = {
  GC: "general_contractor",
  SUB: "subcontractor",
  WORK: "find_work",
};

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

module.exports = { TYPES, accountKind, buildPermissions };
