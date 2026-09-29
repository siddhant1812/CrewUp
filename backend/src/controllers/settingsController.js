const path = require("path");
const fs = require("fs");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");
const TeamMember = require("../models/TeamMember");
const AccountDocument = require("../models/AccountDocument");
const { Activity, logActivity } = require("../models/Activity");

const docsDir = path.join(__dirname, "../../uploads/documents");
fs.mkdirSync(docsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, docsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || "";
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadDocument = upload.single("file");

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

function formatBytes(n) {
  if (!n && n !== 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizePhone(value) {
  const compact = String(value || "")
    .trim()
    .replace(/[^\d+]/g, "");
  if (!compact) return "";
  const withPlus = compact.startsWith("+") ? compact : `+1${compact}`;
  if (!/^\+\d{11,13}$/.test(withPlus)) {
    const err = new Error("Enter a valid country code and 10-digit phone number.");
    err.status = 400;
    throw err;
  }
  return withPlus;
}

function settingsProfile(user) {
  return {
    id: String(user._id),
    fullName: user.fullName,
    workEmail: user.workEmail,
    phoneNumber: user.phoneNumber || "",
    jobTitle: user.jobTitle || "",
    location: user.location || "",
    website: user.website || "",
    profilePhoto: user.profilePhoto || user.profileImage || "",
    contractorType: user.contractorType,
    company: user.company || "",
    companyWebsite: user.companyWebsite || "",
    companyPhone: user.companyPhone || "",
    companyAddress: user.companyAddress || "",
    licenseNumber: user.licenseNumber || "",
    taxId: user.taxId || "",
    payoutEmail: user.payoutEmail || "",
    payoutMethod: user.payoutMethod || "",
    twoFactorEnabled: Boolean(user.twoFactorEnabled),
    emailPreferences: {
      projectUpdates: user.emailPreferences?.projectUpdates !== false,
      newMessages: user.emailPreferences?.newMessages !== false,
      proposalActivity: user.emailPreferences?.proposalActivity !== false,
      marketingEmails: Boolean(user.emailPreferences?.marketingEmails),
    },
    bidPreferences: {
      trades: user.bidPreferences?.trades || [],
      serviceRadiusMiles: user.bidPreferences?.serviceRadiusMiles ?? "",
      minBudget: user.bidPreferences?.minBudget || "",
      notes: user.bidPreferences?.notes || "",
    },
    createdAt: user.createdAt,
  };
}

async function getSettings(req, res) {
  try {
    if (!ensureDb(res)) return;
    const user = await User.findById(req.user._id);
    return res.json({ success: true, profile: settingsProfile(user) });
  } catch (error) {
    console.error("getSettings:", error);
    return res.status(500).json({ success: false, message: "Failed to load settings." });
  }
}

async function updateAccount(req, res) {
  try {
    if (!ensureDb(res)) return;
    const user = await User.findById(req.user._id);
    const { fullName, phoneNumber, jobTitle, location, website } = req.body;

    if (fullName !== undefined) {
      const name = String(fullName).trim();
      if (name.length < 2) {
        return res.status(400).json({ success: false, message: "Name must be at least 2 characters." });
      }
      user.fullName = name;
    }
    if (phoneNumber !== undefined) user.phoneNumber = normalizePhone(phoneNumber);
    if (jobTitle !== undefined) user.jobTitle = String(jobTitle).trim();
    if (location !== undefined) user.location = String(location).trim();
    if (website !== undefined) user.website = String(website).trim();

    await user.save();
    await logActivity(user._id, "account", "Account information updated", "Name, phone, or profile details were saved.");

    return res.json({ success: true, profile: settingsProfile(user) });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error("updateAccount:", error);
    return res.status(500).json({ success: false, message: "Failed to update account." });
  }
}

async function updateCompany(req, res) {
  try {
    if (!ensureDb(res)) return;
    const user = await User.findById(req.user._id);
    const {
      company,
      companyWebsite,
      companyPhone,
      companyAddress,
      licenseNumber,
      taxId,
    } = req.body;

    if (company !== undefined) user.company = String(company).trim();
    if (companyWebsite !== undefined) user.companyWebsite = String(companyWebsite).trim();
    if (companyPhone !== undefined) user.companyPhone = normalizePhone(companyPhone);
    if (companyAddress !== undefined) user.companyAddress = String(companyAddress).trim();
    if (licenseNumber !== undefined) user.licenseNumber = String(licenseNumber).trim();
    if (taxId !== undefined) user.taxId = String(taxId).trim();

    await user.save();
    await logActivity(user._id, "company", "Company information updated", user.company || "");

    return res.json({ success: true, profile: settingsProfile(user) });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error("updateCompany:", error);
    return res.status(500).json({ success: false, message: "Failed to update company." });
  }
}

async function updateNotifications(req, res) {
  try {
    if (!ensureDb(res)) return;
    const user = await User.findById(req.user._id);
    const prefs = req.body.emailPreferences || req.body;
    user.emailPreferences = {
      projectUpdates: prefs.projectUpdates !== false && prefs.projectUpdates !== "false",
      newMessages: prefs.newMessages !== false && prefs.newMessages !== "false",
      proposalActivity: prefs.proposalActivity !== false && prefs.proposalActivity !== "false",
      marketingEmails: prefs.marketingEmails === true || prefs.marketingEmails === "true",
    };
    await user.save();
    await logActivity(user._id, "notifications", "Notification preferences updated");
    return res.json({ success: true, profile: settingsProfile(user) });
  } catch (error) {
    console.error("updateNotifications:", error);
    return res.status(500).json({ success: false, message: "Failed to update notifications." });
  }
}

async function updateBidPreferences(req, res) {
  try {
    if (!ensureDb(res)) return;
    const user = await User.findById(req.user._id);
    const { trades, serviceRadiusMiles, minBudget, notes } = req.body;
    let tradeList = trades;
    if (typeof trades === "string") {
      tradeList = trades.split(",").map((t) => t.trim()).filter(Boolean);
    }
    user.bidPreferences = {
      trades: Array.isArray(tradeList) ? tradeList.map(String) : user.bidPreferences?.trades || [],
      serviceRadiusMiles:
        serviceRadiusMiles === "" || serviceRadiusMiles == null
          ? null
          : Number(serviceRadiusMiles),
      minBudget: minBudget != null ? String(minBudget).trim() : "",
      notes: notes != null ? String(notes).trim() : "",
    };
    await user.save();
    await logActivity(user._id, "bids", "Bid preferences updated");
    return res.json({ success: true, profile: settingsProfile(user) });
  } catch (error) {
    console.error("updateBidPreferences:", error);
    return res.status(500).json({ success: false, message: "Failed to update bid preferences." });
  }
}

async function updatePayouts(req, res) {
  try {
    if (!ensureDb(res)) return;
    const user = await User.findById(req.user._id);
    const { payoutEmail, payoutMethod } = req.body;
    if (payoutEmail !== undefined) user.payoutEmail = String(payoutEmail).trim().toLowerCase();
    if (payoutMethod !== undefined) {
      const method = String(payoutMethod);
      if (!["", "bank", "paypal", "stripe"].includes(method)) {
        return res.status(400).json({ success: false, message: "Invalid payout method." });
      }
      user.payoutMethod = method;
    }
    await user.save();
    await logActivity(user._id, "payouts", "Payout details updated");
    return res.json({ success: true, profile: settingsProfile(user) });
  } catch (error) {
    console.error("updatePayouts:", error);
    return res.status(500).json({ success: false, message: "Failed to update payouts." });
  }
}

async function changePassword(req, res) {
  try {
    if (!ensureDb(res)) return;
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: "Fill in all password fields." });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "New password must be at least 8 characters." });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: "New passwords do not match." });
    }

    const user = await User.findById(req.user._id);
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) {
      return res.status(401).json({ success: false, message: "Current password is incorrect." });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    await logActivity(user._id, "security", "Password changed");
    return res.json({ success: true, message: "Password updated." });
  } catch (error) {
    console.error("changePassword:", error);
    return res.status(500).json({ success: false, message: "Failed to change password." });
  }
}

async function toggleTwoFactor(req, res) {
  try {
    if (!ensureDb(res)) return;
    const user = await User.findById(req.user._id);
    user.twoFactorEnabled = Boolean(req.body.enabled);
    await user.save();
    await logActivity(
      user._id,
      "security",
      user.twoFactorEnabled ? "Two-factor authentication enabled" : "Two-factor authentication disabled"
    );
    return res.json({ success: true, profile: settingsProfile(user) });
  } catch (error) {
    console.error("toggleTwoFactor:", error);
    return res.status(500).json({ success: false, message: "Failed to update two-factor setting." });
  }
}

async function listTeam(req, res) {
  try {
    if (!ensureDb(res)) return;
    const members = await TeamMember.find({
      owner: req.user._id,
      status: { $ne: "removed" },
    })
      .populate("member", "fullName workEmail company")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      members: members.map((m) => ({
        id: String(m._id),
        email: m.email,
        role: m.role,
        status: m.status,
        name: m.member?.fullName || "",
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    console.error("listTeam:", error);
    return res.status(500).json({ success: false, message: "Failed to load team." });
  }
}

async function inviteTeam(req, res) {
  try {
    if (!ensureDb(res)) return;
    const email = String(req.body.email || "").toLowerCase().trim();
    const role = ["admin", "manager", "member"].includes(req.body.role) ? req.body.role : "member";
    if (!email || !email.includes("@")) {
      return res.status(400).json({ success: false, message: "A valid email is required." });
    }
    if (email === req.user.workEmail) {
      return res.status(400).json({ success: false, message: "You cannot invite yourself." });
    }

    const existing = await TeamMember.findOne({
      owner: req.user._id,
      email,
      status: { $ne: "removed" },
    });
    if (existing) {
      return res.status(409).json({ success: false, message: "That person is already on your team." });
    }

    const memberUser = await User.findOne({ workEmail: email });
    const row = await TeamMember.create({
      owner: req.user._id,
      member: memberUser?._id || null,
      email,
      role,
      status: memberUser ? "active" : "pending",
    });

    await logActivity(req.user._id, "team", "Team member invited", email);

    return res.status(201).json({
      success: true,
      member: {
        id: String(row._id),
        email: row.email,
        role: row.role,
        status: row.status,
        name: memberUser?.fullName || "",
        createdAt: row.createdAt,
      },
    });
  } catch (error) {
    console.error("inviteTeam:", error);
    return res.status(500).json({ success: false, message: "Failed to invite teammate." });
  }
}

async function removeTeam(req, res) {
  try {
    if (!ensureDb(res)) return;
    const row = await TeamMember.findOne({ _id: req.params.id, owner: req.user._id });
    if (!row) {
      return res.status(404).json({ success: false, message: "Team member not found." });
    }
    row.status = "removed";
    await row.save();
    await logActivity(req.user._id, "team", "Team member removed", row.email);
    return res.json({ success: true });
  } catch (error) {
    console.error("removeTeam:", error);
    return res.status(500).json({ success: false, message: "Failed to remove teammate." });
  }
}

async function listDocuments(req, res) {
  try {
    if (!ensureDb(res)) return;
    const docs = await AccountDocument.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.json({
      success: true,
      documents: docs.map((d) => ({
        id: String(d._id),
        name: d.originalName,
        url: d.url,
        mimeType: d.mimeType,
        size: d.size,
        sizeLabel: formatBytes(d.size),
        createdAt: d.createdAt,
      })),
    });
  } catch (error) {
    console.error("listDocuments:", error);
    return res.status(500).json({ success: false, message: "Failed to load documents." });
  }
}

async function uploadAccountDocument(req, res) {
  try {
    if (!ensureDb(res)) return;
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Choose a file to upload." });
    }
    const doc = await AccountDocument.create({
      user: req.user._id,
      originalName: req.file.originalname,
      filename: req.file.filename,
      url: `/uploads/documents/${req.file.filename}`,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });
    await logActivity(req.user._id, "documents", "Document uploaded", req.file.originalname);
    return res.status(201).json({
      success: true,
      document: {
        id: String(doc._id),
        name: doc.originalName,
        url: doc.url,
        mimeType: doc.mimeType,
        size: doc.size,
        sizeLabel: formatBytes(doc.size),
        createdAt: doc.createdAt,
      },
    });
  } catch (error) {
    console.error("uploadAccountDocument:", error);
    return res.status(500).json({ success: false, message: "Failed to upload document." });
  }
}

async function deleteDocument(req, res) {
  try {
    if (!ensureDb(res)) return;
    const doc = await AccountDocument.findOne({ _id: req.params.id, user: req.user._id });
    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found." });
    }
    const filePath = path.join(docsDir, doc.filename);
    fs.unlink(filePath, () => {});
    await doc.deleteOne();
    await logActivity(req.user._id, "documents", "Document deleted", doc.originalName);
    return res.json({ success: true });
  } catch (error) {
    console.error("deleteDocument:", error);
    return res.status(500).json({ success: false, message: "Failed to delete document." });
  }
}

const photoDir = path.join(__dirname, "../../uploads/profiles");
fs.mkdirSync(photoDir, { recursive: true });

const photoUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, photoDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  }),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Profile photo must be an image."));
    }
    cb(null, true);
  },
});

const uploadProfilePhoto = photoUpload.single("profilePhoto");

async function updateProfilePhoto(req, res) {
  try {
    if (!ensureDb(res)) return;
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Choose a photo to upload." });
    }

    const user = await User.findById(req.user._id);
    user.profilePhoto = `/uploads/profiles/${req.file.filename}`;
    await user.save();
    await logActivity(user._id, "account", "Profile photo updated");

    return res.json({ success: true, profile: settingsProfile(user) });
  } catch (error) {
    console.error("updateProfilePhoto:", error);
    return res.status(500).json({ success: false, message: "Failed to update photo." });
  }
}

async function listActivity(req, res) {
  try {
    if (!ensureDb(res)) return;
    const items = await Activity.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100);
    return res.json({
      success: true,
      activity: items.map((a) => ({
        id: String(a._id),
        type: a.type,
        title: a.title,
        detail: a.detail,
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    console.error("listActivity:", error);
    return res.status(500).json({ success: false, message: "Failed to load activity." });
  }
}

module.exports = {
  uploadDocument,
  getSettings,
  updateAccount,
  updateCompany,
  updateNotifications,
  updateBidPreferences,
  updatePayouts,
  changePassword,
  toggleTwoFactor,
  listTeam,
  inviteTeam,
  removeTeam,
  listDocuments,
  uploadAccountDocument,
  deleteDocument,
  listActivity,
  uploadProfilePhoto,
  updateProfilePhoto,
};
