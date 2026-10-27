const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Project = require("../models/Project");
const Proposal = require("../models/Proposal");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Review = require("../models/Review");
const { logActivity } = require("../models/Activity");
const { accountKind, buildPermissions } = require("../auth/permissions");

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

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function pagination(req, defaultLimit = 20, maxLimit = 100) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number(req.query.limit) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

function publicAdminUser(user) {
  return {
    id: String(user._id),
    fullName: user.fullName,
    workEmail: user.workEmail,
    company: user.company || "",
    contractorType: user.contractorType,
    role: user.role,
    accountKind: accountKind(user),
    accountStatus: user.accountStatus,
    plan: user.plan || "starter",
    subscriptionStatus: user.subscriptionStatus || "none",
    location: user.location || "",
    phoneNumber: user.phoneNumber || "",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function publicAdminProject(project) {
  const owner =
    project.createdBy && typeof project.createdBy === "object" && project.createdBy._id
      ? project.createdBy
      : null;
  return {
    id: String(project._id),
    title: project.title,
    location: project.location || "",
    projectType: project.projectType || "",
    service: project.service || "",
    postedByRole: project.postedByRole || "contractor",
    budget: project.budget || "",
    vacancies: project.vacancies || 1,
    bidsCount: project.bidsCount || 0,
    status: project.status,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    createdBy: owner
      ? { id: String(owner._id), fullName: owner.fullName, workEmail: owner.workEmail }
      : null,
  };
}

// ---- Dashboard ----

async function getStats(req, res) {
  try {
    if (!ensureDb(res)) return;

    const [
      totalUsers,
      usersByType,
      usersByStatus,
      totalProjects,
      projectsByStatus,
      totalProposals,
      totalConversations,
      totalMessages,
      planCounts,
    ] = await Promise.all([
      User.countDocuments({}),
      User.aggregate([{ $group: { _id: "$contractorType", count: { $sum: 1 } } }]),
      User.aggregate([{ $group: { _id: "$accountStatus", count: { $sum: 1 } } }]),
      Project.countDocuments({}),
      Project.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Proposal.countDocuments({}),
      Conversation.countDocuments({}),
      Message.countDocuments({}),
      User.aggregate([{ $group: { _id: "$plan", count: { $sum: 1 } } }]),
    ]);

    const toMap = (rows) =>
      rows.reduce((acc, r) => {
        acc[r._id || "unknown"] = r.count;
        return acc;
      }, {});

    return res.json({
      success: true,
      stats: {
        totalUsers,
        usersByType: toMap(usersByType),
        usersByStatus: toMap(usersByStatus),
        totalProjects,
        projectsByStatus: toMap(projectsByStatus),
        totalProposals,
        totalConversations,
        totalMessages,
        planCounts: toMap(planCounts),
      },
    });
  } catch (error) {
    console.error("admin getStats:", error);
    return res.status(500).json({ success: false, message: "Failed to load stats." });
  }
}

// ---- Users ----

async function listUsers(req, res) {
  try {
    if (!ensureDb(res)) return;

    const { page, limit, skip } = pagination(req);
    const filter = {};

    if (req.query.q && String(req.query.q).trim()) {
      const rx = new RegExp(escapeRegex(req.query.q.trim()), "i");
      filter.$or = [{ fullName: rx }, { workEmail: rx }, { company: rx }];
    }
    if (req.query.contractorType) filter.contractorType = req.query.contractorType;
    if (req.query.accountStatus) filter.accountStatus = req.query.accountStatus;
    if (req.query.role) filter.role = req.query.role;

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      users: users.map(publicAdminUser),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("admin listUsers:", error);
    return res.status(500).json({ success: false, message: "Failed to load users." });
  }
}

async function getUser(req, res) {
  try {
    if (!ensureDb(res)) return;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid user." });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const [projectCount, proposalCount] = await Promise.all([
      Project.countDocuments({ createdBy: user._id }),
      Proposal.countDocuments({ applicant: user._id }),
    ]);

    return res.json({
      success: true,
      user: { ...publicAdminUser(user), projectCount, proposalCount },
    });
  } catch (error) {
    console.error("admin getUser:", error);
    return res.status(500).json({ success: false, message: "Failed to load user." });
  }
}

// Admin can change anything about an account: status, role, contractor type,
// and plan — this is the "access anything" override the rest of the app
// never grants anyone else.
async function updateUser(req, res) {
  try {
    if (!ensureDb(res)) return;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid user." });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const { accountStatus, role, contractorType, plan, fullName, company } = req.body;

    if (accountStatus !== undefined) {
      if (!["active", "deactivated", "deleted"].includes(accountStatus)) {
        return res.status(400).json({ success: false, message: "Invalid account status." });
      }
      user.accountStatus = accountStatus;
    }
    if (role !== undefined) {
      if (!["business", "provider", "admin"].includes(role)) {
        return res.status(400).json({ success: false, message: "Invalid role." });
      }
      if (String(user._id) === String(req.user._id) && role !== "admin") {
        return res.status(400).json({
          success: false,
          message: "You cannot remove your own admin role.",
        });
      }
      user.role = role;
    }
    if (contractorType !== undefined) {
      if (!["general_contractor", "subcontractor", "find_work"].includes(contractorType)) {
        return res.status(400).json({ success: false, message: "Invalid account type." });
      }
      user.contractorType = contractorType;
    }
    if (plan !== undefined) {
      if (!["starter", "pro", "business"].includes(plan)) {
        return res.status(400).json({ success: false, message: "Invalid plan." });
      }
      user.plan = plan;
    }
    if (fullName !== undefined) user.fullName = String(fullName).trim();
    if (company !== undefined) user.company = String(company).trim();

    await user.save();
    await logActivity(user._id, "system", "Account updated by admin", req.user.fullName);

    return res.json({ success: true, user: publicAdminUser(user) });
  } catch (error) {
    console.error("admin updateUser:", error);
    return res.status(500).json({ success: false, message: "Failed to update user." });
  }
}

// A hard reset for support cases ("I'm locked out") — admin sets a new
// password directly, no current-password check (unlike settingsController's
// self-service changePassword).
async function resetUserPassword(req, res) {
  try {
    if (!ensureDb(res)) return;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid user." });
    }
    const { newPassword } = req.body;
    if (!newPassword || String(newPassword).length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters.",
      });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    await logActivity(user._id, "security", "Password reset by admin");

    return res.json({ success: true, message: "Password updated." });
  } catch (error) {
    console.error("admin resetUserPassword:", error);
    return res.status(500).json({ success: false, message: "Failed to reset password." });
  }
}

async function deleteUser(req, res) {
  try {
    if (!ensureDb(res)) return;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid user." });
    }
    if (String(req.params.id) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: "You cannot delete your own account." });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    return res.json({ success: true, message: "User deleted." });
  } catch (error) {
    console.error("admin deleteUser:", error);
    return res.status(500).json({ success: false, message: "Failed to delete user." });
  }
}

// ---- Projects ----

async function listProjects(req, res) {
  try {
    if (!ensureDb(res)) return;

    const { page, limit, skip } = pagination(req);
    const filter = {};

    if (req.query.q && String(req.query.q).trim()) {
      const rx = new RegExp(escapeRegex(req.query.q.trim()), "i");
      filter.$or = [{ title: rx }, { location: rx }];
    }
    if (req.query.status) filter.status = req.query.status;
    if (req.query.postedByRole) filter.postedByRole = req.query.postedByRole;

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate("createdBy", "fullName workEmail")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Project.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      projects: projects.map(publicAdminProject),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("admin listProjects:", error);
    return res.status(500).json({ success: false, message: "Failed to load projects." });
  }
}

// Admin can set any project to any status, regardless of who owns it —
// normal users can only ever touch their own projects (projectController).
async function updateProjectStatus(req, res) {
  try {
    if (!ensureDb(res)) return;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid project." });
    }
    const status = String(req.body.status || "");
    const allowed = ["draft", "open", "in_progress", "completed", "cancelled"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid project status." });
    }
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("createdBy", "fullName workEmail");
    if (!project) return res.status(404).json({ success: false, message: "Project not found." });

    return res.json({ success: true, project: publicAdminProject(project) });
  } catch (error) {
    console.error("admin updateProjectStatus:", error);
    return res.status(500).json({ success: false, message: "Failed to update project." });
  }
}

async function deleteProject(req, res) {
  try {
    if (!ensureDb(res)) return;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid project." });
    }
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found." });

    await Proposal.deleteMany({ project: project._id });

    return res.json({ success: true, message: "Project deleted." });
  } catch (error) {
    console.error("admin deleteProject:", error);
    return res.status(500).json({ success: false, message: "Failed to delete project." });
  }
}

// ---- Proposals (read-only overview) ----

async function listProposals(req, res) {
  try {
    if (!ensureDb(res)) return;

    const { page, limit, skip } = pagination(req);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const [proposals, total] = await Promise.all([
      Proposal.find(filter)
        .populate("project", "title status")
        .populate("applicant", "fullName workEmail")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Proposal.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      proposals: proposals.map((p) => ({
        id: String(p._id),
        amount: p.amount,
        status: p.status,
        createdAt: p.createdAt,
        project: p.project ? { id: String(p.project._id), title: p.project.title, status: p.project.status } : null,
        applicant: p.applicant
          ? { id: String(p.applicant._id), fullName: p.applicant.fullName, workEmail: p.applicant.workEmail }
          : null,
      })),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("admin listProposals:", error);
    return res.status(500).json({ success: false, message: "Failed to load proposals." });
  }
}

// ---- Reviews (moderation) ----

async function deleteReview(req, res) {
  try {
    if (!ensureDb(res)) return;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid review." });
    }
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: "Review not found." });
    return res.json({ success: true, message: "Review deleted." });
  } catch (error) {
    console.error("admin deleteReview:", error);
    return res.status(500).json({ success: false, message: "Failed to delete review." });
  }
}

module.exports = {
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
};
