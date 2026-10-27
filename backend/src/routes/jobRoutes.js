const express = require("express");
const { browseJobs, getPublicJob, getPublicCategories } = require("../controllers/jobController");
const { optionalAuth } = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes, but optionalAuth reads the token (if any) so a logged-in
// contractor/subcontractor only sees contractor-posted jobs.
router.get("/", optionalAuth, browseJobs);
router.get("/categories", getPublicCategories);
router.get("/:id", optionalAuth, getPublicJob);

module.exports = router;
