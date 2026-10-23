const express = require("express");
const { browseJobs, getPublicJob, getPublicCategories } = require("../controllers/jobController");

const router = express.Router();

router.get("/", browseJobs);
router.get("/categories", getPublicCategories);
router.get("/:id", getPublicJob);

module.exports = router;
