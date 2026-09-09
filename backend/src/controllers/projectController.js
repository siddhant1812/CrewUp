const path = require("path");
const fs = require("fs");
const multer = require("multer");
const mongoose = require("mongoose");
const Project = require("../models/Project");
const Conversation = require("../models/Conversation");

const uploadDir = path.join(__dirname, "../../uploads/projects");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Project image must be an image file."));
    }
    cb(null, true);
  },
});

const uploadProjectImage = upload.single("image");

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

function formatProject(project) {
  return {
    id: String(project._id),
    title: project.title,
    description: project.description || "",
    location: project.location || "",
    projectType: project.projectType || "Commercial",
    budget: project.budget || "",
    dueDate: project.dueDate,
    image: project.image || "",
    trades: project.trades || [],
    bidsCount: project.bidsCount || 0,
    status: project.status,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

function parseTrades(raw) {
  if (Array.isArray(raw)) return raw.map(String).map((t) => t.trim()).filter(Boolean);
  if (typeof raw === "string" && raw.trim()) {
    return raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

async function getDashboardStats(req, res) {
  try {
    if (!ensureDb(res)) return;

    const userId = req.user._id;

    const [activeProjects, messageThreads, recentProjects] = await Promise.all([
      Project.countDocuments({
        createdBy: userId,
        status: { $in: ["open", "in_progress", "draft"] },
      }),
      Conversation.countDocuments({
        participants: userId,
        archivedBy: { $ne: userId },
      }),
      Project.find({ createdBy: userId })
        .sort({ updatedAt: -1 })
        .limit(5),
    ]);

    let unreadMessages = 0;
    const conversations = await Conversation.find({
      participants: userId,
      archivedBy: { $ne: userId },
    }).select("unread");

    for (const c of conversations) {
      if (c.unread instanceof Map) {
        unreadMessages += c.unread.get(String(userId)) || 0;
      } else if (c.unread) {
        unreadMessages += c.unread[String(userId)] || 0;
      }
    }

    return res.json({
      success: true,
      stats: {
        activeProjects,
        messages: messageThreads,
        unreadMessages,
        savedContractors: 0,
        projectInvites: 0,
      },
      recentProjects: recentProjects.map(formatProject),
    });
  } catch (error) {
    console.error("getDashboardStats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard.",
    });
  }
}

async function listProjects(req, res) {
  try {
    if (!ensureDb(res)) return;

    const status = (req.query.status || "").trim();
    const filter = { createdBy: req.user._id };
    if (status) filter.status = status;

    const projects = await Project.find(filter).sort({ updatedAt: -1 });

    return res.json({
      success: true,
      projects: projects.map(formatProject),
    });
  } catch (error) {
    console.error("listProjects:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load projects.",
    });
  }
}

async function getProject(req, res) {
  try {
    if (!ensureDb(res)) return;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    if (String(project.createdBy) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Not allowed.",
      });
    }

    return res.json({
      success: true,
      project: formatProject(project),
    });
  } catch (error) {
    console.error("getProject:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load project.",
    });
  }
}

async function createProject(req, res) {
  try {
    if (!ensureDb(res)) return;

    const {
      title,
      description = "",
      location = "",
      projectType = "Commercial",
      budget = "",
      dueDate = null,
      status = "open",
      trades,
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({
        success: false,
        message: "Project title is required.",
      });
    }

    const allowedStatus = ["draft", "open", "in_progress", "completed", "cancelled"];
    const nextStatus = allowedStatus.includes(status) ? status : "open";

    const image = req.file ? `/uploads/projects/${req.file.filename}` : "";

    const project = await Project.create({
      title: String(title).trim(),
      description: String(description || "").trim(),
      location: String(location || "").trim(),
      projectType: String(projectType || "Commercial").trim(),
      budget: String(budget || "").trim(),
      dueDate: dueDate ? new Date(dueDate) : null,
      image,
      trades: parseTrades(trades),
      status: nextStatus,
      createdBy: req.user._id,
      bidsCount: 0,
    });

    return res.status(201).json({
      success: true,
      message: "Project created.",
      project: formatProject(project),
    });
  } catch (error) {
    console.error("createProject:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create project.",
    });
  }
}

async function updateProject(req, res) {
  try {
    if (!ensureDb(res)) return;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    if (String(project.createdBy) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Not allowed.",
      });
    }

    const fields = [
      "title",
      "description",
      "location",
      "projectType",
      "budget",
      "status",
    ];

    for (const key of fields) {
      if (req.body[key] !== undefined) {
        project[key] = String(req.body[key]).trim();
      }
    }

    if (req.body.dueDate !== undefined) {
      project.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
    }

    if (req.body.trades !== undefined) {
      project.trades = parseTrades(req.body.trades);
    }

    if (req.file) {
      project.image = `/uploads/projects/${req.file.filename}`;
    }

    await project.save();

    return res.json({
      success: true,
      project: formatProject(project),
    });
  } catch (error) {
    console.error("updateProject:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update project.",
    });
  }
}

async function deleteProject(req, res) {
  try {
    if (!ensureDb(res)) return;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    if (String(project.createdBy) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Not allowed.",
      });
    }

    await project.deleteOne();

    return res.json({
      success: true,
      message: "Project deleted.",
    });
  } catch (error) {
    console.error("deleteProject:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete project.",
    });
  }
}

module.exports = {
  uploadProjectImage,
  getDashboardStats,
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
};
