const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  uploadMessageFiles,
  listContacts,
  unreadCount,
  listConversations,
  getConversation,
  createConversation,
  listMessages,
  sendMessage,
  markRead,
  toggleArchive,
} = require("../controllers/messageController");

const router = express.Router();

router.use(protect);

router.get("/contacts", listContacts);
router.get("/unread-count", unreadCount);
router.get("/conversations", listConversations);
router.post("/conversations", createConversation);
router.get("/conversations/:id", getConversation);
router.get("/conversations/:id/messages", listMessages);
router.post("/conversations/:id/messages", (req, res) => {
  uploadMessageFiles(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Invalid file upload.",
      });
    }
    return sendMessage(req, res);
  });
});
router.patch("/conversations/:id/read", markRead);
router.patch("/conversations/:id/archive", toggleArchive);

module.exports = router;
