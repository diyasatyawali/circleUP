const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes"); // Import routes
const communityRoutes = require("./routes/communityRoutes")
const CommunityMessage = require("./models/CommunityMessages");
const communityMessageRoutes = require("./routes/communtiyMessageRoutes");
const http = require("http");
const socketIo = require("socket.io");
const Message = require("./models/Message");
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Database Connection
connectDB();

// Routes
app.use("/api/user", userRoutes);
app.use("/api/messages", messageRoutes); // Add messages route
app.use("/api/communities", communityRoutes);
app.use("/api/community-messages", communityMessageRoutes);

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173", // Allow your frontend to connect
    methods: ["GET", "POST"],
  },
});

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Join a community room
  socket.on("joinCommunity", (communityId) => {
    socket.join(communityId);
    console.log(`User joined community room: ${communityId}`);
  });

  // Send message to a specific community
  socket.on("sendMessage", async ({ communityId, sender, message }) => {
    try {
      // Save message to MongoDB
      const newMessage = new CommunityMessage({
        community: communityId,
        sender,
        message,
      });
      await newMessage.save();

      // Populate sender info before sending
      const populatedMessage = await CommunityMessage.findById(newMessage._id)
        .populate("sender", "name email") // Include whatever fields you want
        .exec();

      console.log(`Message saved in community ${communityId}:`, message);
      io.to(communityId).emit("receiveMessage", populatedMessage);
    } catch (error) {
      console.error("Error saving community message:", error);
    }
  });

  // Handle typing events
  socket.on("typing", ({ communityId, username }) => {
    console.log(`${username} is typing in community ${communityId}`);
    socket.to(communityId).emit("userTyping", username); // Broadcast to all except the sender
  });

  // Join a personal room (userId-based)
  socket.on("joinUser", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their private chat room`);
  });

  // Handle direct messages
  socket.on("sendPrivateMessage", async ({ sender, receiver, message }) => {
    try {
      // Save message to MongoDB
      const newMessage = new Message({ sender, receiver, message });
      await newMessage.save();

      // Emit message to the receiver's room
      io.to(receiver).emit("receivePrivateMessage", {
        sender,
        message,
        timestamp: newMessage.timestamp,
      });

      console.log(`Message from ${sender} to ${receiver}: ${message}`);
    } catch (error) {
      console.error("Error sending private message:", error);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
