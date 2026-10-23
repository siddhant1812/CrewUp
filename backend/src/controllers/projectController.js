const path = require("path");
const fs = require("fs");
const multer = require("multer");
const mongoose = require("mongoose");
const Project = require("../models/Project");
const Conversation = require("../models/Conversation");
const SavedItem = require("../models/SavedItem");
const ProjectInvite = require("../models/ProjectInvite");
const Proposal = require("../models/Proposal");
const { formatProposal } = require("./proposalController");
const { can, accountKind } = require("../auth/permissions");
const { categoriesFor, posterRole, validateCategory } = require("../config/categories");

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
    service: project.service || "",
    postedByRole: project.postedByRole || "contractor",
    budget: project.budget || "",
    vacancies: project.vacancies || 1,
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

function getCategories(req, res) {
  return res.json({
    success: true,
    posterRole: posterRole(req.user.contractorType),
    categories: categoriesFor(req.user.contractorType),
  });
}

async function getDashboardStats(req, res) {
  try {
    if (!ensureDb(res)) return;

    const userId = req.user._id;
    const kind = accountKind(req.user);

    const [activeProjects, messageThreads, recentProjects, savedContractors, projectInvites, openJobs, myBids] =
      await Promise.all([
        Project.countDocuments({
          createdBy: userId,
          status: { $in: ["open", "in_progress", "draft"] },
        }),
        Conversation.countDocuments({
          participants: userId,
          archivedBy: { $ne: userId },
        }),
        Project.find({ createdBy: userId }).sort({ updatedAt: -1 }).limit(5),
        SavedItem.countDocuments({ user: userId, itemType: "contractor" }),
        ProjectInvite.countDocuments({ to: userId, status: "pending" }),
        Project.countDocuments({
          status: "open",
          createdBy: { $ne: userId },
        }),
        Proposal.countDocuments({ applicant: userId, status: { $ne: "withdrawn" } }),
      ]);

    const recommendedJobs =
      kind === "worker"
        ? await Project.find({ status: "open", createdBy: { $ne: userId } })
            .sort({ updatedAt: -1 })
            .limit(5)
        : [];

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
      accountKind: kind,
      stats: {
        activeProjects,
        openJobs,
        myBids,
        messages: messageThreads,
        unreadMessages,
        savedContractors,
        projectInvites,
      },
      recentProjects: recentProjects.map(formatProject),
      recommendedJobs: recommendedJobs.map(formatProject),
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

    const isOwner = String(project.createdBy) === String(req.user._id);
    if (!isOwner && !["open", "in_progress"].includes(project.status)) {
      return res.status(403).json({
        success: false,
        message: "Not allowed.",
      });
    }

    const proposalFilter = { project: project._id };
    if (!isOwner) proposalFilter.applicant = req.user._id;

    const proposals = await Proposal.find(proposalFilter)
      .populate(
        "applicant",
        "fullName company contractorType location jobTitle profilePhoto profileImage workEmail"
      )
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      isOwner,
      project: formatProject(project),
      proposals: proposals.map(formatProposal),
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

    if (!can(req.user, "postProjects")) {
      return res.status(403).json({
        success: false,
        message: "Only contractors and subcontractors can post projects.",
      });
    }

    const {
      title,
      description = "",
      location = "",
      projectType = "",
      service = "",
      budget = "",
      vacancies = 1,
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

    const categoryError = validateCategory(
      req.user.contractorType,
      String(projectType || "").trim(),
      String(service || "").trim()
    );
    if (categoryError) {
      return res.status(400).json({ success: false, message: categoryError });
    }

    const allowedStatus = ["draft", "open", "in_progress", "completed", "cancelled"];
    const nextStatus = allowedStatus.includes(status) ? status : "open";

    const image = req.file ? `/uploads/projects/${req.file.filename}` : "";

    const project = await Project.create({
      title: String(title).trim(),
      description: String(description || "").trim(),
      location: String(location || "").trim(),
      projectType: String(projectType).trim(),
      service: String(service || "").trim(),
      postedByRole: posterRole(req.user.contractorType),
      budget: String(budget || "").trim(),
      vacancies: Math.max(1, Math.min(1000, parseInt(vacancies, 10) || 1)),
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
      "budget",
    ];

    if (req.body.projectType !== undefined || req.body.service !== undefined) {
      const nextCategory = String(req.body.projectType ?? project.projectType).trim();
      const nextService = String(
        req.body.service ?? (req.body.projectType !== undefined ? "" : project.service)
      ).trim();
      const categoryError = validateCategory(req.user.contractorType, nextCategory, nextService);
      if (categoryError) {
        return res.status(400).json({ success: false, message: categoryError });
      }
      project.projectType = nextCategory;
      project.service = nextService;
    }

    for (const key of fields) {
      if (req.body[key] !== undefined) {
        project[key] = String(req.body[key]).trim();
      }
    }

    if (req.body.status !== undefined) {
      const status = String(req.body.status).trim();
      const allowed = ["draft", "open", "in_progress", "completed", "cancelled"];
      if (!allowed.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid project status.",
        });
      }
      project.status = status;
    }

    if (req.body.vacancies !== undefined) {
      project.vacancies = Math.max(1, Math.min(1000, parseInt(req.body.vacancies, 10) || 1));
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

    await Proposal.deleteMany({ project: project._id });
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
  getCategories,
  uploadProjectImage,
  getDashboardStats,
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
};
