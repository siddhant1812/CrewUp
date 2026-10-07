const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const Conversation = require("../models/Conversation");

let io = null;

function userRoom(id) {
  return `user:${String(id)}`;
}

function conversationRoom(id) {
  return `conversation:${String(id)}`;
}

function attachSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: true, credentials: true },
    path: "/socket.io",
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error("Authentication required."));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("_id fullName accountStatus");
      if (!user || user.accountStatus !== "active") {
        return next(new Error("User not found."));
      }

      socket.userId = String(user._id);
      socket.userName = user.fullName;
      next();
    } catch {
      next(new Error("Invalid or expired authentication token."));
    }
  });

  io.on("connection", (socket) => {
    socket.join(userRoom(socket.userId));

    socket.on("join-conversation", async (conversationId) => {
      if (!mongoose.Types.ObjectId.isValid(conversationId)) return;
      const conversation = await Conversation.findById(conversationId).select("participants");
      if (!conversation) return;
      const allowed = conversation.participants.some(
        (id) => String(id) === socket.userId
      );
      if (!allowed) return;
      socket.join(conversationRoom(conversationId));
    });

    socket.on("leave-conversation", (conversationId) => {
      if (conversationId) socket.leave(conversationRoom(conversationId));
    });

    socket.on("typing", ({ conversationId, typing }) => {
      if (!conversationId) return;
      socket.to(conversationRoom(conversationId)).emit("typing", {
        conversationId: String(conversationId),
        userId: socket.userId,
        name: socket.userName,
        typing: Boolean(typing),
      });
    });
  });

  return io;
}

function emitToUser(userId, event, payload) {
  if (!io) return;
  io.to(userRoom(userId)).emit(event, payload);
}

module.exports = {
  attachSocket,
  emitToUser,
};
