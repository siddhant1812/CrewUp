const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const { accountKind, buildPermissions } = require("../src/auth/permissions");

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
  test("subcontractor -> worker", () => {
    assert.equal(accountKind({ role: "provider", contractorType: "subcontractor" }), "worker");
  });
  test("find_work -> worker", () => {
    assert.equal(accountKind({ role: "provider", contractorType: "find_work" }), "worker");
  });
});

describe("buildPermissions", () => {
  test("general contractor can manage a team, subcontractor cannot", () => {
    const gc = buildPermissions({ role: "business", contractorType: "general_contractor" });
    const sub = buildPermissions({ role: "provider", contractorType: "subcontractor" });
    assert.equal(gc.manageTeam, true);
    assert.equal(sub.manageTeam, false);
  });

  test("admin gets every permission regardless of contractorType", () => {
    const p = buildPermissions({ role: "admin", contractorType: "find_work" });
    assert.equal(p.postProjects, true);
    assert.equal(p.applyToJobs, true);
    assert.equal(p.manageTeam, true);
  });

  test("NOT FIXED (documented, matches backend/src/auth/permissions.js): " +
    "buildPermissions throws on a null/undefined user instead of returning guest-level permissions", () => {
    // accountKind(null) is safe and returns "guest", but buildPermissions then
    // reads `user.contractorType` with no null guard a few lines later. Every
    // real call site in this codebase (protect, authController.login) already
    // checks for a user before calling this, so it's unreachable in practice —
    // left as-is to match the identical, already-documented bug in the main
    // backend's permissions.js rather than let the two diverge.
    assert.throws(() => buildPermissions(null), TypeError);
    assert.throws(() => buildPermissions(undefined), TypeError);
  });
});
