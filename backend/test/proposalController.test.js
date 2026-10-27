const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const { formatProposal } = require("../src/controllers/proposalController");

describe("formatProposal", () => {
  function fakeDoc(overrides = {}) {
    return {
      _id: "prop1",
      amount: "$5,000",
      proposal: "I can start Monday.",
      status: "pending",
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-02"),
      applicant: { _id: "u1", fullName: "Shivani", contractorType: "find_work" },
      ...overrides,
    };
  }

  test("formats a populated applicant", () => {
    const out = formatProposal(fakeDoc());
    assert.equal(out.applicant.id, "u1");
    assert.equal(out.applicant.fullName, "Shivani");
  });

  test("falls back to profileImage when profilePhoto is empty", () => {
    const out = formatProposal(
      fakeDoc({ applicant: { _id: "u1", fullName: "S", profileImage: "/img.png" } })
    );
    assert.equal(out.applicant.profilePhoto, "/img.png");
  });

  test("a missing applicant (no doc at all) formats to null, not a crash", () => {
    const out = formatProposal(fakeDoc({ applicant: null }));
    assert.equal(out.applicant, null);
  });

  test("BUG: an un-populated applicant (raw ObjectId, as on the duplicate-proposal 409 path) produces a garbage applicant instead of null or the real user", () => {
    // Proposal.findOne() in createProposal's duplicate-check branch does NOT
    // .populate('applicant'), so `doc.applicant` there is a Mongoose
    // ObjectId, not a user document. formatApplicant has no
    // `typeof === 'object' && user._id` guard (unlike formatPublicJob's
    // equivalent check for `createdBy`), so it happily reads `.fullName`
    // etc. off the ObjectId and gets undefined for everything, while
    // `String(undefined)` turns the id into the literal string "undefined".
    const fakeObjectId = { toString: () => "u1", toHexString: () => "u1" };
    const out = formatProposal(fakeDoc({ applicant: fakeObjectId }));
    assert.equal(out.applicant.id, "undefined"); // should be "u1"
    assert.equal(out.applicant.fullName, undefined); // should be the real name
  });
});
