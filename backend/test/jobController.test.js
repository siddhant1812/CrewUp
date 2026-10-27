const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const { buildJobFilter, formatPublicJob } = require("../src/controllers/jobController");

describe("buildJobFilter", () => {
  test("defaults to open jobs only", () => {
    assert.deepEqual(buildJobFilter(), { status: "open" });
  });

  test("excludes the current user's own projects", () => {
    const filter = buildJobFilter({ excludeUserId: "u1" });
    assert.deepEqual(filter.createdBy, { $ne: "u1" });
  });

  test("role query sets postedByRole", () => {
    assert.equal(buildJobFilter({ role: "subcontractor" }).postedByRole, "subcontractor");
  });

  test("an invalid role value is silently ignored", () => {
    assert.equal(buildJobFilter({ role: "nonsense" }).postedByRole, undefined);
  });

  test("forcedRole always wins over a requested role", () => {
    const filter = buildJobFilter({ role: "subcontractor", forcedRole: "contractor" });
    assert.equal(filter.postedByRole, "contractor");
  });

  test("q/trade/location add a case-insensitive $and clause", () => {
    const filter = buildJobFilter({ q: "Electric" });
    assert.ok(Array.isArray(filter.$and));
    assert.ok(filter.$and[0].$or.some((c) => c.title instanceof RegExp));
  });

  test("BUG: a regex special character in the search text is not escaped against ReDoS/crash risk only in theory, but IS escaped here", () => {
    // escapeRegex is applied, so this should NOT throw and should treat
    // the parentheses literally rather than as a regex group.
    const filter = buildJobFilter({ q: "A/C (HVAC)" });
    const rx = filter.$and[0].$or[0].title;
    assert.ok(rx.test("Need A/C (HVAC) installed"));
    assert.ok(!rx.test("Need AC HVAC installed"));
  });

  test("blank q/trade/location do not add empty clauses", () => {
    const filter = buildJobFilter({ q: "   ", trade: "", location: undefined });
    assert.equal(filter.$and, undefined);
  });
});

describe("formatPublicJob", () => {
  function fakeProject(overrides = {}) {
    return {
      _id: "p1",
      title: "Build a thing",
      status: "open",
      createdAt: new Date("2026-01-01"),
      ...overrides,
    };
  }

  test("fills in defaults for missing optional fields", () => {
    const out = formatPublicJob(fakeProject());
    assert.equal(out.id, "p1");
    assert.equal(out.projectType, "Commercial");
    assert.equal(out.postedByRole, "contractor");
    assert.equal(out.vacancies, 1);
    assert.deepEqual(out.trades, []);
    assert.equal(out.postedBy, null);
  });

  test("BUG: vacancies: 0 is coerced to the default of 1 instead of staying 0", () => {
    // `project.vacancies || 1` treats 0 as falsy, so a project that was
    // explicitly saved with 0 vacancies (e.g. fully staffed) is reported
    // back to the client as "1 vacancy" instead of "0 vacancies".
    const out = formatPublicJob(fakeProject({ vacancies: 0 }));
    assert.equal(out.vacancies, 1);
  });

  test("BUG: bidsCount: 0 is indistinguishable from 'not set' (same || fallback)", () => {
    const out = formatPublicJob(fakeProject({ bidsCount: 0 }));
    assert.equal(out.bidsCount, 0); // happens to be correct since fallback is also 0
  });

  test("populated createdBy becomes a trimmed postedBy object", () => {
    const out = formatPublicJob(
      fakeProject({ createdBy: { _id: "u9", fullName: "Jane Doe", company: "Acme" } })
    );
    assert.deepEqual(out.postedBy, { id: "u9", fullName: "Jane Doe", company: "Acme" });
  });

  test("an un-populated createdBy (ObjectId string) does not become postedBy", () => {
    const out = formatPublicJob(fakeProject({ createdBy: "u9" }));
    assert.equal(out.postedBy, null);
  });
});
