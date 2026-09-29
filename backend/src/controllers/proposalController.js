const mongoose = require("mongoose");
const Project = require("../models/Project");
const Proposal = require("../models/Proposal");
const { logActivity } = require("../models/Activity");

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

function formatApplicant(user) {
  if (!user) return null;
  return {
    id: String(user._id),
    fullName: user.fullName,
    company: user.company || "",
    contractorType: user.contractorType,
    location: user.location || "",
    jobTitle: user.jobTitle || "",
    profilePhoto: user.profilePhoto || user.profileImage || "",
    workEmail: user.workEmail || "",
  };
}

function formatProposal(doc) {
  return {
    id: String(doc._id),
    amount: doc.amount,
    proposal: doc.proposal,
    timeline: doc.timeline || "",
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    applicant: formatApplicant(doc.applicant),
  };
}

async function syncBidsCount(projectId) {
  const count = await Proposal.countDocuments({
    project: projectId,
    status: { $ne: "withdrawn" },
  });
  await Project.findByIdAndUpdate(projectId, { bidsCount: count });
  return count;
}

async function listOpenProjects(req, res) {
  try {
    if (!ensureDb(res)) return;

    const projects = await Project.find({
      createdBy: { $ne: req.user._id },
      status: "open",
    })
      .sort({ updatedAt: -1 })
      .limit(50);

    return res.json({
      success: true,
      projects: projects.map((p) => ({
        id: String(p._id),
        title: p.title,
        description: p.description || "",
        location: p.location || "",
        projectType: p.projectType || "Commercial",
        budget: p.budget || "",
        dueDate: p.dueDate,
        image: p.image || "",
        status: p.status,
        bidsCount: p.bidsCount || 0,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error("listOpenProjects:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load open jobs.",
    });
  }
}

async function listProposals(req, res) {
  try {
    if (!ensureDb(res)) return;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid project." });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    const isOwner = String(project.createdBy) === String(req.user._id);
    const filter = { project: project._id };
    if (!isOwner) filter.applicant = req.user._id;

    const proposals = await Proposal.find(filter)
      .populate(
        "applicant",
        "fullName company contractorType location jobTitle profilePhoto profileImage workEmail"
      )
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      isOwner,
      proposals: proposals.map(formatProposal),
    });
  } catch (error) {
    console.error("listProposals:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load proposals.",
    });
  }
}

async function createProposal(req, res) {
  try {
    if (!ensureDb(res)) return;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid project." });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }
    if (String(project.createdBy) === String(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot apply to your own project.",
      });
    }
    if (project.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "This project is not accepting proposals.",
      });
    }

    const amount = String(req.body.amount || "").trim();
    const proposalText = String(req.body.proposal || "").trim();
    const timeline = String(req.body.timeline || "").trim();

    if (!amount || !proposalText) {
      return res.status(400).json({
        success: false,
        message: "Bid amount and proposal are required.",
      });
    }

    const existing = await Proposal.findOne({
      project: project._id,
      applicant: req.user._id,
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "You already submitted a proposal for this project.",
        proposal: formatProposal(existing),
      });
    }

    const created = await Proposal.create({
      project: project._id,
      applicant: req.user._id,
      amount,
      proposal: proposalText,
      timeline,
    });

    await syncBidsCount(project._id);
    await logActivity(
      req.user._id,
      "proposal",
      "Proposal submitted",
      `${project.title} · ${amount}`
    );
    await logActivity(
      project.createdBy,
      "proposal",
      "New proposal received",
      `${req.user.fullName} · ${project.title}`
    );

    const populated = await created.populate(
      "applicant",
      "fullName company contractorType location jobTitle profilePhoto profileImage workEmail"
    );

    return res.status(201).json({
      success: true,
      proposal: formatProposal(populated),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You already submitted a proposal for this project.",
      });
    }
    console.error("createProposal:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit proposal.",
    });
  }
}

async function respondProposal(req, res) {
  try {
    if (!ensureDb(res)) return;

    const status = String(req.body.status || "").toLowerCase();
    if (!["accepted", "declined"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Choose accepted or declined.",
      });
    }

    const proposal = await Proposal.findById(req.params.proposalId).populate(
      "applicant",
      "fullName company contractorType location jobTitle profilePhoto profileImage workEmail"
    );
    if (!proposal) {
      return res.status(404).json({ success: false, message: "Proposal not found." });
    }

    const project = await Project.findById(proposal.project);
    if (!project || String(project.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not allowed." });
    }
    if (proposal.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "This proposal was already answered.",
      });
    }

    proposal.status = status;
    await proposal.save();
    await logActivity(
      req.user._id,
      "proposal",
      `Proposal ${status}`,
      `${proposal.applicant?.fullName || "Applicant"} · ${project.title}`
    );

    return res.json({
      success: true,
      proposal: formatProposal(proposal),
    });
  } catch (error) {
    console.error("respondProposal:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update proposal.",
    });
  }
}

module.exports = {
  listOpenProjects,
  listProposals,
  createProposal,
  respondProposal,
  formatProposal,
};
