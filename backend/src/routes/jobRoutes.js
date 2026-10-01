const express = require("express");
const { browseJobs, getPublicJob } = require("../controllers/jobController");

const router = express.Router();

router.get("/", browseJobs);
router.get("/:id", getPublicJob);

module.exports = router;
