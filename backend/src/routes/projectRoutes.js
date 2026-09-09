const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  uploadProjectImage,
  getDashboardStats,
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");

const router = express.Router();

router.use(protect);

router.get("/dashboard", getDashboardStats);
router.get("/", listProjects);
router.post("/", (req, res) => {
  uploadProjectImage(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Invalid project image.",
      });
    }
    return createProject(req, res);
  });
});
router.get("/:id", getProject);
router.patch("/:id", (req, res) => {
  uploadProjectImage(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Invalid project image.",
      });
    }
    return updateProject(req, res);
  });
});
router.delete("/:id", deleteProject);

module.exports = router;
