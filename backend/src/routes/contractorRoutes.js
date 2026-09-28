const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  listContractors,
  listSaved,
  toggleSaved,
  listInvites,
  createInvite,
  respondInvite,
} = require("../controllers/contractorController");

const router = express.Router();
router.use(protect);

router.get("/", listContractors);
router.get("/saved", listSaved);
router.get("/invites", listInvites);
router.post("/invites", createInvite);
router.patch("/invites/:id", respondInvite);
router.post("/:id/save", toggleSaved);

module.exports = router;
