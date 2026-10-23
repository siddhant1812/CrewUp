const mongoose = require("mongoose");
const Project = require("../models/Project");
const { CONTRACTOR_CATEGORIES, SUBCONTRACTOR_CATEGORIES } = require("../config/categories");

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

function textMatch(value) {
  return new RegExp(escapeRegex(value.trim()), "i");
}

function buildJobFilter({ q, trade, location, type, role, excludeUserId } = {}) {
  const filter = { status: "open" };

  if (excludeUserId) {
    filter.createdBy = { $ne: excludeUserId };
  }

  const clauses = [];

  if (q && String(q).trim()) {
    const rx = textMatch(q);
    clauses.push({
      $or: [
        { title: rx },
        { description: rx },
        { location: rx },
        { trades: rx },
        { projectType: rx },
        { service: rx },
      ],
    });
  }

  if (trade && String(trade).trim()) {
    clauses.push({ trades: textMatch(trade) });
  }

  if (location && String(location).trim()) {
    clauses.push({ location: textMatch(location) });
  }

  if (type && String(type).trim()) {
    filter.projectType = textMatch(type);
  }

  if (role === "contractor" || role === "subcontractor") {
    filter.postedByRole = role;
  }

  if (clauses.length) {
    filter.$and = clauses;
  }

  return filter;
}

function formatPublicJob(project) {
  const owner =
    project.createdBy && typeof project.createdBy === "object" && project.createdBy._id
      ? project.createdBy
      : null;

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
    postedBy: owner
      ? {
          id: String(owner._id),
          fullName: owner.fullName || "",
          company: owner.company || "",
        }
      : null,
  };
}

function getPublicCategories(_req, res) {
  return res.json({
    success: true,
    contractor: CONTRACTOR_CATEGORIES,
    subcontractor: SUBCONTRACTOR_CATEGORIES,
  });
}

async function browseJobs(req, res) {
  try {
    if (!ensureDb(res)) return;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
    const filter = buildJobFilter(req.query);

    const [jobs, total, tradeValues, locations] = await Promise.all([
      Project.find(filter)
        .populate("createdBy", "fullName company")
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Project.countDocuments(filter),
      Project.distinct("trades", { status: "open" }),
      Project.distinct("location", { status: "open" }),
    ]);

    return res.json({
      success: true,
      jobs: jobs.map(formatPublicJob),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      filters: {
        trades: tradeValues.filter(Boolean).sort(),
        locations: locations.filter(Boolean).sort(),
      },
    });
  } catch (error) {
    console.error("browseJobs:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load jobs.",
    });
  }
}

async function getPublicJob(req, res) {
  try {
    if (!ensureDb(res)) return;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job.",
      });
    }

    const project = await Project.findById(req.params.id).populate(
      "createdBy",
      "fullName company"
    );

    if (!project || !["open", "in_progress"].includes(project.status)) {
      return res.status(404).json({
        success: false,
        message: "Job not found.",
      });
    }

    return res.json({
      success: true,
      job: formatPublicJob(project),
    });
  } catch (error) {
    console.error("getPublicJob:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load job.",
    });
  }
}

module.exports = {
  getPublicCategories,
  browseJobs,
  getPublicJob,
  buildJobFilter,
  formatPublicJob,
};
