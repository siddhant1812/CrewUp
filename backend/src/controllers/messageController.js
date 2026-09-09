const path = require("path");
const fs = require("fs");
const multer = require("multer");
const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");

const uploadDir = path.join(__dirname, "../../uploads/messages");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || "";
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
    ];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("File type not allowed."));
    }
    cb(null, true);
  },
});

const uploadMessageFiles = upload.array("files", 5);

function ensureDb(res) {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      success: false,
      message: "Database is not connected.",
    });
    return false;
  }
  return true;
}

function pairKeyFor(a, b) {
  return [String(a), String(b)].sort().join("_");
}

function avatarOf(user) {
  if (!user) return "";
  return user.profilePhoto || user.profileImage || "";
}

function formatUser(user) {
  if (!user) return null;
  return {
    id: String(user._id),
    fullName: user.fullName,
    company: user.company || "",
    contractorType: user.contractorType,
    profilePhoto: avatarOf(user),
    location: user.location || "",
    memberSince: user.createdAt,
  };
}

function otherParticipant(conversation, userId) {
  const uid = String(userId);
  return (conversation.participants || []).find((p) => String(p._id || p) !== uid);
}

function unreadFor(conversation, userId) {
  if (!conversation.unread) return 0;
  if (conversation.unread instanceof Map) {
    return conversation.unread.get(String(userId)) || 0;
  }
  return conversation.unread[String(userId)] || 0;
}

function bumpUnread(conversation, userId, nextValue) {
  const key = String(userId);
  if (!(conversation.unread instanceof Map)) {
    conversation.unread = new Map(
      Object.entries(conversation.unread || {})
    );
  }
  conversation.unread.set(key, Math.max(0, nextValue));
}

function formatBytes(n) {
  if (!n && n !== 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatConversation(conversation, userId) {
  const other = otherParticipant(conversation, userId);
  const unread = unreadFor(conversation, userId);
  const archived = (conversation.archivedBy || []).some(
    (id) => String(id) === String(userId)
  );

  return {
    id: String(conversation._id),
    other: formatUser(other),
    projectTitle: conversation.projectTitle || "",
    projectLocation: conversation.projectLocation || "",
    projectType: conversation.projectType || "Commercial",
    budget: conversation.budget || "",
    bidDeadline: conversation.bidDeadline,
    trades: conversation.trades || [],
    projectImage: conversation.projectImage || "",
    preview: conversation.lastMessage?.text || "",
    lastMessageAt: conversation.lastMessage?.createdAt || conversation.updatedAt,
    unread,
    archived,
    updatedAt: conversation.updatedAt,
    createdAt: conversation.createdAt,
  };
}

function formatMessage(message, userId) {
  const senderId = String(message.sender?._id || message.sender);
  const fromMe = senderId === String(userId);
  const readByOthers = (message.readBy || []).some(
    (id) => String(id) !== String(userId)
  );

  return {
    id: String(message._id),
    from: message.type === "system" ? "system" : fromMe ? "me" : "them",
    text: message.text || "",
    type: message.type,
    systemPayload: message.systemPayload || null,
    attachments: (message.attachments || []).map((a) => ({
      name: a.originalName,
      url: a.url,
      mimeType: a.mimeType,
      size: a.size,
      sizeLabel: formatBytes(a.size),
    })),
    time: message.createdAt,
    read: fromMe ? readByOthers : (message.readBy || []).some(
      (id) => String(id) === String(userId)
    ),
    sender: formatUser(message.sender),
  };
}

async function listContacts(req, res) {
  try {
    if (!ensureDb(res)) return;

    const q = (req.query.q || "").trim();
    const filter = {
      _id: { $ne: req.user._id },
      accountStatus: "active",
    };

    if (q) {
      filter.$or = [
        { fullName: { $regex: q, $options: "i" } },
        { company: { $regex: q, $options: "i" } },
        { workEmail: { $regex: q, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .select("fullName company contractorType profilePhoto profileImage location createdAt")
      .sort({ fullName: 1 })
      .limit(40);

    return res.json({
      success: true,
      contacts: users.map(formatUser),
    });
  } catch (error) {
    console.error("listContacts:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load contacts.",
    });
  }
}

async function unreadCount(req, res) {
  try {
    if (!ensureDb(res)) return;

    const conversations = await Conversation.find({
      participants: req.user._id,
      archivedBy: { $ne: req.user._id },
    }).select("unread");

    let total = 0;
    for (const c of conversations) {
      total += unreadFor(c, req.user._id);
    }

    return res.json({ success: true, count: total });
  } catch (error) {
    console.error("unreadCount:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load unread count.",
    });
  }
}

async function listConversations(req, res) {
  try {
    if (!ensureDb(res)) return;

    const tab = (req.query.tab || "all").toLowerCase();
    const q = (req.query.q || "").trim().toLowerCase();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const userId = req.user._id;

    let filter = { participants: userId };

    if (tab === "archive") {
      filter.archivedBy = userId;
    } else {
      filter.archivedBy = { $ne: userId };
    }

    let conversations = await Conversation.find(filter)
      .populate(
        "participants",
        "fullName company contractorType profilePhoto profileImage location createdAt"
      )
      .sort({ "lastMessage.createdAt": -1, updatedAt: -1 });

    if (tab === "unread") {
      conversations = conversations.filter((c) => unreadFor(c, userId) > 0);
    } else if (tab === "gc") {
      conversations = conversations.filter((c) => {
        const other = otherParticipant(c, userId);
        return other?.contractorType === "general_contractor";
      });
    } else if (tab === "subs" || tab === "project") {
      conversations = conversations.filter((c) => {
        const other = otherParticipant(c, userId);
        return other?.contractorType === "subcontractor";
      });
    }

    if (q) {
      conversations = conversations.filter((c) => {
        const other = otherParticipant(c, userId);
        const hay = [
          other?.fullName,
          other?.company,
          c.projectTitle,
          c.projectLocation,
          c.lastMessage?.text,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    const total = conversations.length;
    const pageItems = conversations.slice(skip, skip + limit).map((c) =>
      formatConversation(c, userId)
    );

    const allForCounts = await Conversation.find({
      participants: userId,
      archivedBy: { $ne: userId },
    }).populate("participants", "contractorType");

    const counts = {
      all: allForCounts.length,
      unread: allForCounts.filter((c) => unreadFor(c, userId) > 0).length,
      gc: allForCounts.filter((c) => {
        const other = otherParticipant(c, userId);
        return other?.contractorType === "general_contractor";
      }).length,
      project: allForCounts.filter((c) => {
        const other = otherParticipant(c, userId);
        return other?.contractorType === "subcontractor";
      }).length,
      archive: await Conversation.countDocuments({
        participants: userId,
        archivedBy: userId,
      }),
    };

    const totalUnread = allForCounts.reduce(
      (sum, c) => sum + unreadFor(c, userId),
      0
    );

    return res.json({
      success: true,
      conversations: pageItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      counts,
      totalUnread,
    });
  } catch (error) {
    console.error("listConversations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load conversations.",
    });
  }
}

async function getConversation(req, res) {
  try {
    if (!ensureDb(res)) return;

    const conversation = await Conversation.findById(req.params.id).populate(
      "participants",
      "fullName company contractorType profilePhoto profileImage location createdAt"
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    if (!conversation.participants.some((p) => String(p._id) === String(req.user._id))) {
      return res.status(403).json({
        success: false,
        message: "Not allowed.",
      });
    }

    const files = await Message.find({
      conversation: conversation._id,
      "attachments.0": { $exists: true },
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("attachments createdAt");

    const sharedFiles = [];
    for (const m of files) {
      for (const a of m.attachments || []) {
        sharedFiles.push({
          name: a.originalName,
          url: a.url,
          mimeType: a.mimeType,
          size: a.size,
          sizeLabel: formatBytes(a.size),
          date: m.createdAt,
        });
      }
    }

    return res.json({
      success: true,
      conversation: formatConversation(conversation, req.user._id),
      sharedFiles,
    });
  } catch (error) {
    console.error("getConversation:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load conversation.",
    });
  }
}

async function createConversation(req, res) {
  try {
    if (!ensureDb(res)) return;

    const {
      participantId,
      projectTitle = "",
      projectLocation = "",
      projectType = "Commercial",
      budget = "",
      bidDeadline = null,
      trades = [],
      initialMessage = "",
    } = req.body;

    if (!participantId || !mongoose.Types.ObjectId.isValid(participantId)) {
      return res.status(400).json({
        success: false,
        message: "A valid participant is required.",
      });
    }

    if (String(participantId) === String(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot message yourself.",
      });
    }

    const other = await User.findById(participantId);
    if (!other || other.accountStatus !== "active") {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const pairKey = pairKeyFor(req.user._id, other._id);
    let conversation = await Conversation.findOne({ pairKey }).populate(
      "participants",
      "fullName company contractorType profilePhoto profileImage location createdAt"
    );

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, other._id],
        pairKey,
        projectTitle: String(projectTitle || "").trim(),
        projectLocation: String(projectLocation || "").trim(),
        projectType: String(projectType || "Commercial").trim(),
        budget: String(budget || "").trim(),
        bidDeadline: bidDeadline ? new Date(bidDeadline) : null,
        trades: Array.isArray(trades) ? trades.map(String) : [],
        unread: {
          [String(req.user._id)]: 0,
          [String(other._id)]: 0,
        },
      });
      conversation = await Conversation.findById(conversation._id).populate(
        "participants",
        "fullName company contractorType profilePhoto profileImage location createdAt"
      );
    }

    const text = String(initialMessage || "").trim();
    if (text) {
      const message = await Message.create({
        conversation: conversation._id,
        sender: req.user._id,
        text,
        type: "text",
        readBy: [req.user._id],
      });

      conversation.lastMessage = {
        text,
        sender: req.user._id,
        createdAt: message.createdAt,
      };
      bumpUnread(conversation, other._id, unreadFor(conversation, other._id) + 1);
      conversation.archivedBy = (conversation.archivedBy || []).filter(
        (id) => String(id) !== String(req.user._id) && String(id) !== String(other._id)
      );
      await conversation.save();
    }

    return res.status(201).json({
      success: true,
      conversation: formatConversation(conversation, req.user._id),
    });
  } catch (error) {
    console.error("createConversation:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to start conversation.",
    });
  }
}

async function listMessages(req, res) {
  try {
    if (!ensureDb(res)) return;

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    if (!conversation.participants.some((id) => String(id) === String(req.user._id))) {
      return res.status(403).json({
        success: false,
        message: "Not allowed.",
      });
    }

    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const before = req.query.before;

    const filter = { conversation: conversation._id };
    if (before && mongoose.Types.ObjectId.isValid(before)) {
      const pivot = await Message.findById(before).select("createdAt");
      if (pivot) filter.createdAt = { $lt: pivot.createdAt };
    }

    const messages = await Message.find(filter)
      .populate("sender", "fullName company contractorType profilePhoto profileImage location createdAt")
      .sort({ createdAt: -1 })
      .limit(limit);

    const ordered = messages.reverse().map((m) => formatMessage(m, req.user._id));

    return res.json({
      success: true,
      messages: ordered,
    });
  } catch (error) {
    console.error("listMessages:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load messages.",
    });
  }
}

async function sendMessage(req, res) {
  try {
    if (!ensureDb(res)) return;

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    if (!conversation.participants.some((id) => String(id) === String(req.user._id))) {
      return res.status(403).json({
        success: false,
        message: "Not allowed.",
      });
    }

    const text = String(req.body.text || "").trim();
    const files = req.files || [];

    if (!text && files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message text or a file is required.",
      });
    }

    const attachments = files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: `/uploads/messages/${file.filename}`,
    }));

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      text,
      attachments,
      type: attachments.length && !text ? "file" : "text",
      readBy: [req.user._id],
    });

    const preview =
      text ||
      (attachments.length === 1
        ? `Sent ${attachments[0].originalName}`
        : `Sent ${attachments.length} files`);

    conversation.lastMessage = {
      text: preview,
      sender: req.user._id,
      createdAt: message.createdAt,
    };

    for (const participantId of conversation.participants) {
      const key = String(participantId);
      if (key === String(req.user._id)) {
        bumpUnread(conversation, participantId, 0);
      } else {
        bumpUnread(
          conversation,
          participantId,
          unreadFor(conversation, participantId) + 1
        );
      }
    }

    conversation.archivedBy = [];
    await conversation.save();

    const populated = await Message.findById(message._id).populate(
      "sender",
      "fullName company contractorType profilePhoto profileImage location createdAt"
    );

    return res.status(201).json({
      success: true,
      message: formatMessage(populated, req.user._id),
    });
  } catch (error) {
    console.error("sendMessage:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send message.",
    });
  }
}

async function markRead(req, res) {
  try {
    if (!ensureDb(res)) return;

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    if (!conversation.participants.some((id) => String(id) === String(req.user._id))) {
      return res.status(403).json({
        success: false,
        message: "Not allowed.",
      });
    }

    bumpUnread(conversation, req.user._id, 0);
    await conversation.save();

    await Message.updateMany(
      {
        conversation: conversation._id,
        sender: { $ne: req.user._id },
        readBy: { $ne: req.user._id },
      },
      { $addToSet: { readBy: req.user._id } }
    );

    return res.json({ success: true });
  } catch (error) {
    console.error("markRead:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark as read.",
    });
  }
}

async function toggleArchive(req, res) {
  try {
    if (!ensureDb(res)) return;

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    if (!conversation.participants.some((id) => String(id) === String(req.user._id))) {
      return res.status(403).json({
        success: false,
        message: "Not allowed.",
      });
    }

    const uid = String(req.user._id);
    const isArchived = (conversation.archivedBy || []).some((id) => String(id) === uid);

    if (isArchived) {
      conversation.archivedBy = conversation.archivedBy.filter((id) => String(id) !== uid);
    } else {
      conversation.archivedBy.push(req.user._id);
    }

    await conversation.save();

    return res.json({
      success: true,
      archived: !isArchived,
    });
  } catch (error) {
    console.error("toggleArchive:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update archive.",
    });
  }
}

module.exports = {
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
};
