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

    // ✅ ADD THESE (admin system)
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

  },
  { collection: "users" }
);

// ✅ FIX: must be "User" (not "users") for populate to work
module.exports = mongoose.model("User", newUserSchema);