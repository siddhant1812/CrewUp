const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const {
  CONTRACTOR_CATEGORIES,
  SUBCONTRACTOR_CATEGORIES,
  categoriesFor,
  posterRole,
  validateCategory,
} = require("../src/config/categories");

describe("categoriesFor", () => {
  test("general_contractor gets the 5 project-type categories", () => {
    assert.equal(categoriesFor("general_contractor"), CONTRACTOR_CATEGORIES);
  });
  test("subcontractor gets the trade categories", () => {
    assert.equal(categoriesFor("subcontractor"), SUBCONTRACTOR_CATEGORIES);
  });
  test("BUG: find_work also resolves to the subcontractor trade list", () => {
    // find_work accounts can never post (blocked by the postProjects
    // permission), so this is unreachable in practice, but the function
    // itself treats any non-contractor string the same as "subcontractor".
    assert.equal(categoriesFor("find_work"), SUBCONTRACTOR_CATEGORIES);
    assert.equal(categoriesFor("totally_bogus"), SUBCONTRACTOR_CATEGORIES);
  });
});

describe("posterRole", () => {
  test("general_contractor -> contractor", () => {
    assert.equal(posterRole("general_contractor"), "contractor");
  });
  test("anything else -> subcontractor", () => {
    assert.equal(posterRole("subcontractor"), "subcontractor");
    assert.equal(posterRole("find_work"), "subcontractor");
  });
});

describe("validateCategory", () => {
  test("accepts a real contractor category + service pair", () => {
    assert.equal(
      validateCategory("general_contractor", "Commercial Construction", "Hotel construction"),
      ""
    );
  });

  test("rejects a category that does not exist for this poster", () => {
    const err = validateCategory("general_contractor", "Electrical", "");
    assert.match(err, /project type/i);
  });

  test("rejects a subcontractor service that belongs to a different category", () => {
    const err = validateCategory("subcontractor", "Electrical", "Hotel construction");
    assert.match(err, /service/i);
  });

  test("accepts a category with no service (service is optional)", () => {
    assert.equal(validateCategory("subcontractor", "Electrical", ""), "");
  });

  test("rejects a missing category", () => {
    const err = validateCategory("general_contractor", "", "");
    assert.ok(err);
  });

  test("BUG: category matching is case-sensitive, so a lowercase match is rejected", () => {
    // "hotel construction" is a real service under "Commercial Construction",
    // but validateCategory does a plain `.includes()` check, so any case or
    // whitespace difference from the exact string in categories.js fails
    // with the generic "service doesn't belong" message instead of matching.
    const err = validateCategory(
      "general_contractor",
      "Commercial Construction",
      "hotel construction"
    );
    assert.match(err, /service/i);
  });
});
