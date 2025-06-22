const express = require("express");
const router = express.Router();
const CommunityMessage = require("../models/CommunityMessages");

// Get messages for a specific community
router.get("/:communityId", async (req, res) => {
  try {
    const messages = await CommunityMessage.find({
      community: req.params.communityId,
    })
      .populate("sender", "name email") // Include sender info
      .sort({ createdAt: 1 }); // Sort by creation time (oldest first)

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
