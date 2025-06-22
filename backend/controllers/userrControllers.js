const User = require("../models/User");
const jwt = require("jsonwebtoken");
const JWT_SECRET = "abcdefghijklmnopqrstuvw";

// Helper function to determine display name
const getDisplayName = (user, viewerId) => {
  if (!viewerId) return user.anonymousName;

  const friendEntry = user.friends.find((f) => f.friend.equals(viewerId));
  return friendEntry?.showName ? user.name : user.anonymousName;
};

// Signup - Modified to require anonymousName
exports.signup = async (req, res) => {
  try {
    const { name, email, password, anonymousName , picture } = req.body;

    if (!anonymousName) {
      return res.status(400).json({ message: "Anonymous name is required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const newUser = new User({ name, email, password, anonymousName, picture });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id, role: "User" }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "Signup successful",
      user: { ...newUser.toObject(), password: undefined },
      token,
      success: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Signup failed", error });
  }
};

// Login - Unchanged
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id, role: "User" }, JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({
      message: "Login successful",
      user: { ...user.toObject(), password: undefined },
      token,
      success: true,
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error });
  }
};

// Get all users - Modified to show appropriate names
exports.getAllUsers = async (req, res) => {
  try {
    const requestingUserId = req.user?.id;
    const users = await User.find().populate("friends.friend");

    const usersWithDisplayNames = users.map((user) => ({
      ...user.toObject(),
      displayName: getDisplayName(user, requestingUserId),
      password: undefined,
    }));

    res.status(200).json(usersWithDisplayNames);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching users", error });
  }
};

// Get single user by ID - Modified to show appropriate name
exports.getSingleUser = async (req, res) => {
  try {
    const { id } = req.body;
    
    const user = await User.findById(id).populate("friends.friend");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }


    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user", error });
  }
};

// Toggle name visibility for a friend


// Add friend - Modified to initialize with showName: false
exports.addFriend = async (req, res) => {
  try {
    const { userId, id } = req.body;

    if (userId === id) {
      return res
        .status(400)
        .json({ message: "You cannot add yourself as a friend" });
    }

    const user = await User.findById(userId);
    const secondUser = await User.findById(id);

    if (!user || !secondUser) {
      return res.status(404).json({ message: "One or both users not found" });
    }

    // Check if already friends
    const alreadyFriend = user.friends.some((f) => f.friend.equals(id));
    if (alreadyFriend) {
      return res.status(400).json({ message: "Users are already friends" });
    }

    // Add each other with showName defaulting to false
    user.friends.push({ friend: id, showName: false });
    secondUser.friends.push({ friend: userId, showName: false });

    await user.save();
    await secondUser.save();

    return res.status(200).json({
      success: true,
      message: "Friend added successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to add friend", error });
  }
};

// The goal-related functions remain unchanged
exports.addGoal = async (req, res) => {
  try {
    const { userId, goal } = req.body;
    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { goals: goal } },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "Goal added successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Failed to add goal", error });
  }
};

exports.deleteGoal = async (req, res) => {
  try {
    const { userId, goal } = req.body;
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { goals: goal } },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "Goal removed successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Failed to remove goal", error });
  }
};

exports.updateGoal = async (req, res) => {
  try {
    const { userId, oldGoal, newGoal } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    const goalIndex = user.goals.indexOf(oldGoal);
    if (goalIndex === -1)
      return res.status(400).json({ message: "Old goal not found" });
    user.goals[goalIndex] = newGoal;
    await user.save();
    res.status(200).json({ message: "Goal updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Failed to update goal", error });
  }
};

// In your user controller
exports.toggleNameVisibility = async (req, res) => {
  try {
    const { userId, friendId , value } = req.body;

    const user = await User.findById(friendId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the friend entry and update showName
    const friendEntry = user.friends.find(
      (f) => f.friend.toString() === userId
    );

    if (!friendEntry) {
      return res
        .status(404)
        .json({ message: "Friend not found in user's friend list" });
    }

    // Toggle or set showName
    friendEntry.showName = value;

    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Visibility updated" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update visibility", error });
  }
};

