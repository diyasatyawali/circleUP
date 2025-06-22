const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
    },
    password: {
      type: String,
    },
    anonymousName: {
      type: String,
    },
    goals: [
      {
        type: String,
      },
    ],
    picture: {
      type: String,
    },
    // In userSchema
    friends: [
      {
        friend: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        showName: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
