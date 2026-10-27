const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const { requireAdmin } = require("../src/middleware/authMiddleware");

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

describe("requireAdmin", () => {
  test("calls next() for role: admin", () => {
    const req = { user: { role: "admin" } };
    const res = mockRes();
    let called = false;
    requireAdmin(req, res, () => {
      called = true;
    });
    assert.equal(called, true);
    assert.equal(res.statusCode, null);
  });

  test("responds 403 for a non-admin user", () => {
    const req = { user: { role: "business", contractorType: "general_contractor" } };
    const res = mockRes();
    let called = false;
    requireAdmin(req, res, () => {
      called = true;
    });
    assert.equal(called, false);
    assert.equal(res.statusCode, 403);
  });

  test("responds 403 (not a crash) when req.user is missing entirely", () => {
    const req = {};
    const res = mockRes();
    let called = false;
    requireAdmin(req, res, () => {
      called = true;
    });
    assert.equal(called, false);
    assert.equal(res.statusCode, 403);
  });
});
