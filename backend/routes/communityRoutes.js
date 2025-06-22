// routes/communityRoutes.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const Community = require("../models/Community");
const User = require("../models/User");

// Create a new community (Admin only)
router.post("/", async (req, res) => {
  try {
    const { name, description, admin } = req.body;
   

    const community = new Community({ name, description, admin, users: [admin] });
    await community.save();

    res.status(201).json(community);
  } catch (error) {
    console.error("Error creating community:", error);
    res.status(500).json({ message: "Server Error", error });
  }
});

// Add users to a community (Admin only)
router.post("/:communityId/add-users", async (req, res) => {
  try {
    const { userIds , id } = req.body; // Array of user IDs to add
    const community = await Community.findById(req.params.communityId);

    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    // Check if the current user is the admin of the community
    if (community.admin.toString() !== id) {
      return res.status(403).json({ message: "Only the admin can add users" });
    }

    // Add users to the community
    community.users = [...new Set([...community.users, ...userIds])]; // Avoid duplicates
    await community.save();

    res.status(200).json(community);
  } catch (error) {
    console.error("Error adding users to community:", error);
    res.status(500).json({ message: "Server Error", error });
  }
});

// Get all communities for a user
router.post("/my-communities", async (req, res) => {
  try {
    const {userId} = req.body
    const communities = await Community.find({ users: userId }).populate("admin", "name").populate("users");
    res.status(200).json(communities);
  } catch (error) {
    console.error("Error fetching communities:", error);
    res.status(500).json({ message: "Server Error", error });
  }
});

router.post("/all", async (req, res) => {
  try {
    // Check if the user is an admin (optional, based on your requirements)
    
   

    // Fetch all communities
    const communities = await Community.find().populate("admin", "name");
    res.status(200).json(communities);
  } catch (error) {
    console.error("Error fetching all communities:", error);
    res.status(500).json({ message: "Server Error", error });
  }
});

module.exports = router;