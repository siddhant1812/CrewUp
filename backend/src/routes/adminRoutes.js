const express = require("express");
const { protect, requireAdmin } = require("../middleware/authMiddleware");
const {
  getStats,
  listUsers,
  getUser,
  updateUser,
  resetUserPassword,
  deleteUser,
  listProjects,
  updateProjectStatus,
  deleteProject,
  listProposals,
  deleteReview,
} = require("../controllers/adminController");

const router = express.Router();

// Every route here requires a logged-in user whose role is "admin" — see
// requireAdmin in middleware/authMiddleware.js. There is no per-permission
// gating beyond that: an admin can read and change anything below.
router.use(protect, requireAdmin);

router.get("/stats", getStats);

router.get("/users", listUsers);
router.get("/users/:id", getUser);
router.patch("/users/:id", updateUser);
router.post("/users/:id/reset-password", resetUserPassword);
router.delete("/users/:id", deleteUser);

router.get("/projects", listProjects);
router.patch("/projects/:id/status", updateProjectStatus);
router.delete("/projects/:id", deleteProject);

router.get("/proposals", listProposals);

router.delete("/reviews/:id", deleteReview);

module.exports = router;
