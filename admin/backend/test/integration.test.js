// Integration tests against a throwaway, isolated in-memory MongoDB —
// never the real Atlas cluster. This is the only way to exercise
// login/protect/updateUser/deleteUser honestly, since they're all
// database-driven and the pure unit tests (adminController.unit.test.js,
// permissions.test.js, authMiddleware.test.js) only cover the parts of this
// codebase that don't touch the DB.
const { test, describe, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "test-secret-not-used-anywhere-real";

let mongod;
let User;
let Project;
let authController;
let adminController;
let protectMw;
let requireAdminMw;

function mockRes() {
  const res = { statusCode: 200, body: null };
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

async function makeUser(overrides = {}) {
  const password = overrides.plainPassword || "password123";
  const hashed = await bcrypt.hash(password, 4);
  return User.create({
    fullName: "Test User",
    workEmail: `user-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    password: hashed,
    contractorType: "general_contractor",
    role: "business",
    accountStatus: "active",
    ...overrides,
    password: hashed,
  });
}

function tokenFor(user) {
  return jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
}

before(async () => {
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.ADMIN_CODE = "1234";
  const { MongoMemoryServer } = require("mongodb-memory-server");
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri("crewup_admin_test"));

  User = require("../src/models/User");
  Project = require("../src/models/Project");
  authController = require("../src/controllers/authController");
  adminController = require("../src/controllers/adminController");
  ({ protect: protectMw, requireAdmin: requireAdminMw } = require("../src/middleware/authMiddleware"));
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe("authController.login", () => {
  test("rejects an unknown email", async () => {
    const req = { body: { workEmail: "nobody@example.com", password: "whatever", adminCode: "1234" } };
    const res = mockRes();
    await authController.login(req, res);
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.success, false);
  });

  test("rejects a wrong password for a real admin account", async () => {
    const admin = await makeUser({ role: "admin", plainPassword: "correct-password" });
    const req = { body: { workEmail: admin.workEmail, password: "wrong-password", adminCode: "1234" } };
    const res = mockRes();
    await authController.login(req, res);
    assert.equal(res.statusCode, 401);
  });

  test("rejects a correct password when the account is not an admin", async () => {
    const user = await makeUser({ role: "business", plainPassword: "correct-password" });
    const req = { body: { workEmail: user.workEmail, password: "correct-password", adminCode: "1234" } };
    const res = mockRes();
    await authController.login(req, res);
    assert.equal(res.statusCode, 403);
    assert.match(res.body.message, /admin access/i);
  });

  test("rejects a deactivated admin account even with the correct password", async () => {
    const admin = await makeUser({
      role: "admin",
      accountStatus: "deactivated",
      plainPassword: "correct-password",
    });
    const req = { body: { workEmail: admin.workEmail, password: "correct-password", adminCode: "1234" } };
    const res = mockRes();
    await authController.login(req, res);
    assert.equal(res.statusCode, 403);
  });

  test("logs in a real, active admin account and never leaks the password hash", async () => {
    const admin = await makeUser({ role: "admin", plainPassword: "correct-password" });
    const req = { body: { workEmail: admin.workEmail, password: "correct-password", adminCode: "1234" } };
    const res = mockRes();
    await authController.login(req, res);
    assert.equal(res.statusCode, 200);
    assert.ok(res.body.token);
    assert.equal(res.body.user.password, undefined);
    assert.equal(res.body.user.role, "admin");
  });

  test("rejects a correct login when the admin code is wrong", async () => {
    const admin = await makeUser({ role: "admin", plainPassword: "correct-password" });
    const req = { body: { workEmail: admin.workEmail, password: "correct-password", adminCode: "0000" } };
    const res = mockRes();
    await authController.login(req, res);
    assert.equal(res.statusCode, 403);
    assert.match(res.body.message, /admin code/i);
  });
});

describe("authController.signup", () => {
  function uniqueEmail() {
    return `signup-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  }

  test("creates a real admin account and logs in immediately", async () => {
    const email = uniqueEmail();
    const req = {
      body: {
        fullName: "New Admin",
        workEmail: email,
        password: "password123",
        confirmPassword: "password123",
        adminCode: "1234",
      },
    };
    const res = mockRes();
    await authController.signup(req, res);
    assert.equal(res.statusCode, 201);
    assert.ok(res.body.token);
    assert.equal(res.body.user.role, "admin");
    assert.equal(res.body.user.password, undefined);

    const stored = await User.findOne({ workEmail: email.toLowerCase() });
    assert.equal(stored.role, "admin");
    assert.equal(stored.accountStatus, "active");
  });

  test("the token from signup works on protect() for later requests", async () => {
    const req = {
      body: {
        fullName: "New Admin",
        workEmail: uniqueEmail(),
        password: "password123",
        confirmPassword: "password123",
        adminCode: "1234",
      },
    };
    const res = mockRes();
    await authController.signup(req, res);

    const protectedReq = { headers: { authorization: `Bearer ${res.body.token}` } };
    const protectedRes = mockRes();
    let called = false;
    await protectMw(protectedReq, protectedRes, () => (called = true));
    assert.equal(called, true);
    assert.equal(protectedReq.user.role, "admin");
  });

  test("rejects a duplicate email", async () => {
    const email = uniqueEmail();
    const body = {
      fullName: "First",
      workEmail: email,
      password: "password123",
      confirmPassword: "password123",
      adminCode: "1234",
    };
    await authController.signup({ body }, mockRes());

    const res = mockRes();
    await authController.signup({ body: { ...body, fullName: "Second" } }, res);
    assert.equal(res.statusCode, 409);
  });

  test("rejects mismatched passwords", async () => {
    const req = {
      body: {
        fullName: "New Admin",
        workEmail: uniqueEmail(),
        password: "password123",
        confirmPassword: "different456",
        adminCode: "1234",
      },
    };
    const res = mockRes();
    await authController.signup(req, res);
    assert.equal(res.statusCode, 400);
  });

  test("rejects a password under 8 characters", async () => {
    const req = {
      body: {
        fullName: "New Admin",
        workEmail: uniqueEmail(),
        password: "short",
        confirmPassword: "short",
        adminCode: "1234",
      },
    };
    const res = mockRes();
    await authController.signup(req, res);
    assert.equal(res.statusCode, 400);
  });

  test("rejects an invalid email format", async () => {
    const req = {
      body: {
        fullName: "New Admin",
        workEmail: "not-an-email",
        password: "password123",
        confirmPassword: "password123",
        adminCode: "1234",
      },
    };
    const res = mockRes();
    await authController.signup(req, res);
    assert.equal(res.statusCode, 400);
  });

  test("rejects missing fields instead of crashing", async () => {
    const res = mockRes();
    await authController.signup({ body: {} }, res);
    assert.equal(res.statusCode, 400);
  });

  test("rejects a wrong admin code", async () => {
    const req = {
      body: {
        fullName: "New Admin",
        workEmail: uniqueEmail(),
        password: "password123",
        confirmPassword: "password123",
        adminCode: "0000",
      },
    };
    const res = mockRes();
    await authController.signup(req, res);
    assert.equal(res.statusCode, 403);
  });
});

describe("authMiddleware.protect", () => {
  test("401s with no Authorization header", async () => {
    const req = { headers: {} };
    const res = mockRes();
    let called = false;
    await protectMw(req, res, () => (called = true));
    assert.equal(called, false);
    assert.equal(res.statusCode, 401);
  });

  test("401s on a garbage token", async () => {
    const req = { headers: { authorization: "Bearer not-a-real-jwt" } };
    const res = mockRes();
    let called = false;
    await protectMw(req, res, () => (called = true));
    assert.equal(called, false);
    assert.equal(res.statusCode, 401);
  });

  test("403s for a deactivated account even with a valid token", async () => {
    const user = await makeUser({ accountStatus: "deactivated" });
    const req = { headers: { authorization: `Bearer ${tokenFor(user)}` } };
    const res = mockRes();
    let called = false;
    await protectMw(req, res, () => (called = true));
    assert.equal(called, false);
    assert.equal(res.statusCode, 403);
  });

  test("attaches req.user for a valid token on an active account", async () => {
    const user = await makeUser({});
    const req = { headers: { authorization: `Bearer ${tokenFor(user)}` } };
    const res = mockRes();
    let called = false;
    await protectMw(req, res, () => (called = true));
    assert.equal(called, true);
    assert.equal(String(req.user._id), String(user._id));
  });
});

describe("adminController.updateUser — self-protection", () => {
  test("an admin cannot remove their own admin role", async () => {
    const admin = await makeUser({ role: "admin" });
    const req = {
      params: { id: String(admin._id) },
      body: { role: "business" },
      user: admin,
    };
    const res = mockRes();
    await adminController.updateUser(req, res);
    assert.equal(res.statusCode, 400);
    const fresh = await User.findById(admin._id);
    assert.equal(fresh.role, "admin");
  });

  test("FIXED BUG: an admin cannot deactivate their own account either " +
    "(previously only `role` self-changes were blocked, not `accountStatus`)", async () => {
    const admin = await makeUser({ role: "admin" });
    const req = {
      params: { id: String(admin._id) },
      body: { accountStatus: "deactivated" },
      user: admin,
    };
    const res = mockRes();
    await adminController.updateUser(req, res);
    assert.equal(res.statusCode, 400);
    const fresh = await User.findById(admin._id);
    assert.equal(fresh.accountStatus, "active");
  });

  test("FIXED BUG: an admin cannot soft-delete their own account via accountStatus", async () => {
    const admin = await makeUser({ role: "admin" });
    const req = {
      params: { id: String(admin._id) },
      body: { accountStatus: "deleted" },
      user: admin,
    };
    const res = mockRes();
    await adminController.updateUser(req, res);
    assert.equal(res.statusCode, 400);
  });

  test("an admin CAN set their own accountStatus back to active (no-op allowed)", async () => {
    const admin = await makeUser({ role: "admin" });
    const req = {
      params: { id: String(admin._id) },
      body: { accountStatus: "active" },
      user: admin,
    };
    const res = mockRes();
    await adminController.updateUser(req, res);
    assert.equal(res.statusCode, 200);
  });

  test("an admin CAN deactivate a different user's account", async () => {
    const admin = await makeUser({ role: "admin" });
    const target = await makeUser({});
    const req = {
      params: { id: String(target._id) },
      body: { accountStatus: "deactivated" },
      user: admin,
    };
    const res = mockRes();
    await adminController.updateUser(req, res);
    assert.equal(res.statusCode, 200);
    const fresh = await User.findById(target._id);
    assert.equal(fresh.accountStatus, "deactivated");
  });

  test("rejects an invalid accountStatus value instead of saving garbage", async () => {
    const admin = await makeUser({ role: "admin" });
    const target = await makeUser({});
    const req = {
      params: { id: String(target._id) },
      body: { accountStatus: "banned" },
      user: admin,
    };
    const res = mockRes();
    await adminController.updateUser(req, res);
    assert.equal(res.statusCode, 400);
  });

  test("404s for a well-formed but nonexistent user id", async () => {
    const admin = await makeUser({ role: "admin" });
    const req = {
      params: { id: new mongoose.Types.ObjectId().toString() },
      body: { accountStatus: "deactivated" },
      user: admin,
    };
    const res = mockRes();
    await adminController.updateUser(req, res);
    assert.equal(res.statusCode, 404);
  });

  test("400s for a malformed user id instead of crashing", async () => {
    const admin = await makeUser({ role: "admin" });
    const req = { params: { id: "not-an-object-id" }, body: {}, user: admin };
    const res = mockRes();
    await adminController.updateUser(req, res);
    assert.equal(res.statusCode, 400);
  });
});

describe("adminController.deleteUser — self-protection", () => {
  test("an admin cannot delete their own account", async () => {
    const admin = await makeUser({ role: "admin" });
    const req = { params: { id: String(admin._id) }, user: admin };
    const res = mockRes();
    await adminController.deleteUser(req, res);
    assert.equal(res.statusCode, 400);
    assert.ok(await User.findById(admin._id));
  });

  test("an admin CAN delete a different user", async () => {
    const admin = await makeUser({ role: "admin" });
    const target = await makeUser({});
    const req = { params: { id: String(target._id) }, user: admin };
    const res = mockRes();
    await adminController.deleteUser(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(await User.findById(target._id), null);
  });
});

describe("adminController.listUsers — pagination regression", () => {
  test("FIXED BUG: a fractional page/limit no longer crashes the query " +
    "(previously threw from the MongoDB driver on a non-integer skip/limit)", async () => {
    await makeUser({});
    const req = { query: { page: "1.5", limit: "10.7" } };
    const res = mockRes();
    await assert.doesNotReject(() => adminController.listUsers(req, res));
    assert.equal(res.statusCode, 200);
    assert.ok(Array.isArray(res.body.users));
  });
});

describe("adminController.deleteProject cascades to proposals", () => {
  test("deleting a project also deletes its proposals", async () => {
    const Proposal = require("../src/models/Proposal");
    const admin = await makeUser({ role: "admin" });
    const owner = await makeUser({});
    const applicant = await makeUser({});
    const project = await Project.create({ title: "Test project", createdBy: owner._id });
    await Proposal.create({
      project: project._id,
      applicant: applicant._id,
      amount: "$100",
      proposal: "I can do this.",
    });

    const req = { params: { id: String(project._id) }, user: admin };
    const res = mockRes();
    await adminController.deleteProject(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(await Project.findById(project._id), null);
    assert.equal(await Proposal.countDocuments({ project: project._id }), 0);
  });
});
