const mongoose = require("mongoose");

// user schema/model
const newUserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      label: "username",
    },
    email: {
      type: String,
      required: true,
      label: "email",
    },
    password: {
      type: String,
      required: true,
      min: 8,
    },
    date: {
      type: Date,
      default: Date.now,
    },

    // admin system
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    warned: {
      type: Boolean,
      default: false,
    },

    // ⭐ REQUIRED FOR PROFILE SYSTEM ⭐
    avatarUrl: {
      type: String,
      default: null,
    },
    backgroundUrl: {
      type: String,
      default: null,
    },
  },
  { collection: "users" }
);

module.exports = mongoose.model("User", newUserSchema);
