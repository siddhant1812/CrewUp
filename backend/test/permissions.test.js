const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const {
  roleFromContractorType,
  accountKind,
  buildPermissions,
  jobVisibilityRole,
  can,
  authorizePermission,
} = require("../src/auth/permissions");

describe("roleFromContractorType", () => {
  test("general_contractor -> business", () => {
    assert.equal(roleFromContractorType("general_contractor"), "business");
  });
  test("subcontractor -> provider", () => {
    assert.equal(roleFromContractorType("subcontractor"), "provider");
  });
  test("find_work -> provider", () => {
    assert.equal(roleFromContractorType("find_work"), "provider");
  });
  test("unknown type falls back to business", () => {
    assert.equal(roleFromContractorType("something_else"), "business");
  });
});

describe("accountKind", () => {
  test("no user -> guest", () => {
    assert.equal(accountKind(null), "guest");
    assert.equal(accountKind(undefined), "guest");
  });
  test("role admin -> admin, regardless of contractorType", () => {
    assert.equal(accountKind({ role: "admin", contractorType: "find_work" }), "admin");
  });
  test("general_contractor -> contractor", () => {
    assert.equal(accountKind({ role: "business", contractorType: "general_contractor" }), "contractor");
  });
  test("subcontractor -> worker (BUG: subcontractors are also posters, see buildPermissions)", () => {
    // accountKind only ever returns "contractor" for general_contractor; every
    // other non-admin type (including subcontractor) falls into "worker".
    assert.equal(accountKind({ role: "provider", contractorType: "subcontractor" }), "worker");
  });
  test("find_work -> worker", () => {
    assert.equal(accountKind({ role: "provider", contractorType: "find_work" }), "worker");
  });
});

describe("buildPermissions", () => {
  test("general contractor can post/hire/manage but not apply", () => {
    const p = buildPermissions({ role: "business", contractorType: "general_contractor" });
    assert.equal(p.postProjects, true);
    assert.equal(p.manageTeam, true);
    assert.equal(p.hire, true);
    assert.equal(p.applyToJobs, false);
  });

  test("subcontractor can both post and apply", () => {
    const p = buildPermissions({ role: "provider", contractorType: "subcontractor" });
    assert.equal(p.postProjects, true);
    assert.equal(p.applyToJobs, true);
    // manageTeam is still contractor-only
    assert.equal(p.manageTeam, false);
  });

  test("find_work can apply but not post", () => {
    const p = buildPermissions({ role: "provider", contractorType: "find_work" });
    assert.equal(p.postProjects, false);
    assert.equal(p.applyToJobs, true);
  });

  test("admin can do everything regardless of contractorType", () => {
    const p = buildPermissions({ role: "admin", contractorType: "find_work" });
    assert.equal(p.postProjects, true);
    assert.equal(p.applyToJobs, true);
    assert.equal(p.manageTeam, true);
  });

  test("BUG: buildPermissions crashes on a null/undefined user", () => {
    // accountKind(null) returns "guest" safely, but buildPermissions then does
    // `user.contractorType` unconditionally a few lines later with no null
    // check, so it throws instead of returning guest-level permissions.
    assert.throws(() => buildPermissions(null), TypeError);
    assert.throws(() => buildPermissions(undefined), TypeError);
  });
});

describe("jobVisibilityRole", () => {
  test("contractor viewer is restricted to contractor-posted jobs", () => {
    assert.equal(jobVisibilityRole({ role: "business", contractorType: "general_contractor" }), "contractor");
  });
  test("subcontractor viewer is also restricted to contractor-posted jobs", () => {
    assert.equal(jobVisibilityRole({ role: "provider", contractorType: "subcontractor" }), "contractor");
  });
  test("find_work viewer is unrestricted", () => {
    assert.equal(jobVisibilityRole({ role: "provider", contractorType: "find_work" }), null);
  });
  test("admin viewer is unrestricted", () => {
    assert.equal(jobVisibilityRole({ role: "admin", contractorType: "general_contractor" }), null);
  });
  test("guest (no user) is unrestricted", () => {
    assert.equal(jobVisibilityRole(null), null);
  });
});

describe("can", () => {
  test("returns false for no user instead of throwing", () => {
    assert.equal(can(null, "postProjects"), false);
  });
  test("reflects buildPermissions for a real user", () => {
    assert.equal(can({ role: "business", contractorType: "general_contractor" }, "postProjects"), true);
    assert.equal(can({ role: "business", contractorType: "general_contractor" }, "applyToJobs"), false);
  });
});

describe("authorizePermission", () => {
  function mockRes() {
    const res = { statusCode: null, body: null };
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (body) => {
      res.body = body;
      return res;
    };
    return res;
  }

  test("calls next() when the user has one of the required permissions", () => {
    const req = { user: { role: "business", contractorType: "general_contractor" } };
    req.permissions = buildPermissions(req.user);
    const res = mockRes();
    let nextCalled = false;
    authorizePermission("postProjects")(req, res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, null);
  });

  test("responds 403 when the user lacks every required permission", () => {
    const req = { user: { role: "business", contractorType: "general_contractor" } };
    req.permissions = buildPermissions(req.user);
    const res = mockRes();
    let nextCalled = false;
    authorizePermission("applyToJobs")(req, res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.success, false);
  });
});
