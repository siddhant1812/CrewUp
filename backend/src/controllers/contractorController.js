const mongoose = require("mongoose");
const User = require("../models/User");
const SavedItem = require("../models/SavedItem");
const Project = require("../models/Project");
const ProjectInvite = require("../models/ProjectInvite");
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

function formatContractor(user, savedIds) {
  return {
    id: String(user._id),
    fullName: user.fullName,
    company: user.company || "",
    contractorType: user.contractorType,
    location: user.location || "",
    jobTitle: user.jobTitle || "",
    profilePhoto: user.profilePhoto || user.profileImage || "",
    saved: savedIds.has(String(user._id)),
    memberSince: user.createdAt,
  };
}

async function listContractors(req, res) {
  try {
    if (!ensureDb(res)) return;

    const q = String(req.query.q || "").trim();
    const type = String(req.query.type || "").trim();

    if (q.length < 2) {
      return res.json({ success: true, contractors: [] });
    }

    const filter = {
      _id: { $ne: req.user._id },
      accountStatus: { $nin: ["deactivated", "deleted"] },
    };

    if (["subcontractor", "general_contractor", "find_work"].includes(type)) {
      filter.contractorType = type;
    }

    if (q) {
      filter.$or = [
        { fullName: { $regex: q, $options: "i" } },
        { company: { $regex: q, $options: "i" } },
        { location: { $regex: q, $options: "i" } },
        { jobTitle: { $regex: q, $options: "i" } },
      ];
    }

    const [users, saved] = await Promise.all([
      User.find(filter)
        .select("fullName company contractorType location jobTitle profilePhoto profileImage createdAt")
        .sort({ fullName: 1 })
        .limit(80),
      SavedItem.find({ user: req.user._id, itemType: "contractor" }).select("itemId"),
    ]);

    const savedIds = new Set(saved.map((s) => String(s.itemId)));

    return res.json({
      success: true,
      contractors: users.map((u) => formatContractor(u, savedIds)),
    });
  } catch (error) {
    console.error("listContractors:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load contractors.",
    });
  }
}

async function listSaved(req, res) {
  try {
    if (!ensureDb(res)) return;

    const items = await SavedItem.find({
      user: req.user._id,
      itemType: "contractor",
    }).sort({ createdAt: -1 });

    const ids = items.map((i) => i.itemId);
    const users = await User.find({ _id: { $in: ids } }).select(
      "fullName company contractorType location jobTitle profilePhoto profileImage createdAt"
    );
    const byId = new Map(users.map((u) => [String(u._id), u]));
    const savedIds = new Set(ids.map(String));
    const contractors = ids
      .map((id) => byId.get(String(id)))
      .filter(Boolean)
      .map((u) => formatContractor(u, savedIds));

    return res.json({
      success: true,
      contractors,
    });
  } catch (error) {
    console.error("listSaved:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load saved contractors.",
    });
  }
}

async function toggleSaved(req, res) {
  try {
    if (!ensureDb(res)) return;

    const contractorId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(contractorId)) {
      return res.status(400).json({ success: false, message: "Invalid contractor." });
    }
    if (String(contractorId) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: "You cannot save yourself." });
    }

    const other = await User.findById(contractorId);
    if (!other || ["deactivated", "deleted"].includes(other.accountStatus)) {
      return res.status(404).json({ success: false, message: "Contractor not found." });
    }

    const existing = await SavedItem.findOne({
      user: req.user._id,
      itemType: "contractor",
      itemId: contractorId,
    });

    if (existing) {
      await existing.deleteOne();
      return res.json({ success: true, saved: false });
    }

    await SavedItem.create({
      user: req.user._id,
      itemType: "contractor",
      itemId: contractorId,
    });
    await logActivity(req.user._id, "saved", "Saved a contractor", other.fullName);

    return res.json({ success: true, saved: true });
  } catch (error) {
    if (error.code === 11000) {
      return res.json({ success: true, saved: true });
    }
    console.error("toggleSaved:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update saved contractor.",
    });
  }
}

async function listInvites(req, res) {
  try {
    if (!ensureDb(res)) return;

    const box = String(req.query.box || "received").toLowerCase();
    const filter = box === "sent" ? { from: req.user._id } : { to: req.user._id };

    const invites = await ProjectInvite.find(filter)
      .populate("project", "title location dueDate status")
      .populate("from", "fullName company")
      .populate("to", "fullName company")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      invites: invites.map((inv) => ({
        id: String(inv._id),
        status: inv.status,
        message: inv.message || "",
        project: inv.project
          ? {
              id: String(inv.project._id),
              title: inv.project.title,
              location: inv.project.location,
              dueDate: inv.project.dueDate,
              status: inv.project.status,
            }
          : null,
        from: inv.from
          ? { id: String(inv.from._id), fullName: inv.from.fullName, company: inv.from.company }
          : null,
        to: inv.to
          ? { id: String(inv.to._id), fullName: inv.to.fullName, company: inv.to.company }
          : null,
        createdAt: inv.createdAt,
      })),
    });
  } catch (error) {
    console.error("listInvites:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load invites.",
    });
  }
}

async function createInvite(req, res) {
  try {
    if (!ensureDb(res)) return;

    const { projectId, contractorId, message = "" } = req.body;
    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(contractorId)) {
      return res.status(400).json({ success: false, message: "Project and contractor are required." });
    }
    if (String(contractorId) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: "You cannot invite yourself." });
    }

    const project = await Project.findById(projectId);
    if (!project || String(project.createdBy) !== String(req.user._id)) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    const contractor = await User.findById(contractorId);
    if (!contractor || ["deactivated", "deleted"].includes(contractor.accountStatus)) {
      return res.status(404).json({ success: false, message: "Contractor not found." });
    }

    const invite = await ProjectInvite.findOneAndUpdate(
      { project: project._id, to: contractor._id },
      {
        from: req.user._id,
        status: "pending",
        message: String(message || "").trim(),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await logActivity(
      req.user._id,
      "invite",
      "Project invite sent",
      `${contractor.fullName} · ${project.title}`
    );

    return res.status(201).json({
      success: true,
      invite: {
        id: String(invite._id),
        status: invite.status,
      },
    });
  } catch (error) {
    console.error("createInvite:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send invite.",
    });
  }
}

async function respondInvite(req, res) {
  try {
    if (!ensureDb(res)) return;

    const status = String(req.body.status || "").toLowerCase();
    if (!["accepted", "declined"].includes(status)) {
      return res.status(400).json({ success: false, message: "Choose accepted or declined." });
    }

    const invite = await ProjectInvite.findById(req.params.id);
    if (!invite || String(invite.to) !== String(req.user._id)) {
      return res.status(404).json({ success: false, message: "Invite not found." });
    }
    if (invite.status !== "pending") {
      return res.status(400).json({ success: false, message: "This invite was already answered." });
    }

    invite.status = status;
    await invite.save();
    await logActivity(req.user._id, "invite", `Project invite ${status}`);

    return res.json({ success: true, invite: { id: String(invite._id), status: invite.status } });
  } catch (error) {
    console.error("respondInvite:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update invite.",
    });
  }
}

module.exports = {
  listContractors,
  listSaved,
  toggleSaved,
  listInvites,
  createInvite,
  respondInvite,
};
