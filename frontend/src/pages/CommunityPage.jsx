import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Header";
import axios from "axios";
import {
  FaPaperPlane,
  FaUsers,
  FaHashtag,
  FaRegSmile,
  FaPaperclip,
  FaEllipsisV,
  FaSearch,
  FaChevronDown,
} from "react-icons/fa";
import { BsCheck2All } from "react-icons/bs";
import { format } from "date-fns";

const CommunityPage = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const user = JSON.parse(localStorage.getItem("user"));
  const id = user?._id;
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [communities, setCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Connect to Socket.IO server
  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    // Listen for incoming messages
    newSocket.on("receiveMessage", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Listen for typing events
    newSocket.on("userTyping", (username) => {
      setTypingUser(username);
      setIsTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        setTypingUser("");
      }, 3000);
    });

    return () => {
      newSocket.disconnect();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // Join community and fetch messages
  useEffect(() => {
    if (!selectedCommunity) return;

    const joinAndFetchMessages = async () => {
      try {
        setLoadingMessages(true);
        if (socket) {
          socket.emit("joinCommunity", selectedCommunity._id);
        }

        // Fetch previous messages
        const res = await axios.get(
          `http://localhost:5000/api/community-messages/${selectedCommunity._id}`
        );
        setMessages(res.data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoadingMessages(false);
      }
    };

    joinAndFetchMessages();
  }, [selectedCommunity, socket]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch communities
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const res = await axios.post(
          "http://localhost:5000/api/communities/my-communities",
          { userId: id }
        );
        setCommunities(res.data);
      } catch (error) {
        console.error("Error fetching communities:", error);
      }
    };
    fetchCommunities();
  }, [id]);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !socket || !selectedCommunity) return;

    try {
      const messageData = {
        communityId: selectedCommunity._id,
        sender: user._id,
        message: newMessage,
      };

      socket.emit("sendMessage", messageData);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Handle typing
  const handleTyping = () => {
    if (socket && selectedCommunity) {
      socket.emit("typing", {
        communityId: selectedCommunity._id,
        username: user.name,
      });
    }
  };

  // Filter communities
  const filteredCommunities = communities.filter((community) =>
    community.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <FaUsers className="mr-2 text-indigo-500" />
              My Communities
            </h2>
            <div className="mt-3 relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search communities..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Communities List */}
          <div className="flex-1 overflow-y-auto">
            {filteredCommunities.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchTerm ? "No communities found" : "No communities joined"}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredCommunities.map((community) => (
                  <motion.div
                    key={community._id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-3 flex items-center gap-3 cursor-pointer transition-colors ${
                      selectedCommunity?._id === community._id
                        ? "bg-indigo-50"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedCommunity(community)}
                  >
                    <div className="bg-indigo-100 p-2 rounded-lg">
                      <FaHashtag className="text-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {community.name}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">
                        {community.description || "No description"}
                      </p>
                    </div>
                    {selectedCommunity?._id === community._id && (
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedCommunity ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <FaHashtag className="text-indigo-500" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-800">
                      {selectedCommunity.name}
                    </h2>
                    <AnimatePresence>
                      {isTyping ? (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-xs text-gray-500"
                        >
                          {typingUser} is typing...
                        </motion.p>
                      ) : (
                        <p className="text-xs text-gray-500">
                          {selectedCommunity.users?.length || 0} members
                        </p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                  <FaEllipsisV />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {loadingMessages ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <div className="bg-indigo-100 p-4 rounded-full mb-3">
                      <FaHashtag className="text-2xl text-indigo-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-600">
                      No messages yet
                    </h3>
                    <p className="text-sm">
                      Start the conversation in #{selectedCommunity.name}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {messages.map((message) => (
                        <motion.div
                          key={message._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className={`flex ${
                            message.sender._id === user._id
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.sender._id === user._id
                                ? "bg-indigo-500 text-white rounded-tr-none"
                                : "bg-white text-gray-800 rounded-tl-none shadow-sm"
                            }`}
                          >
                            {message.sender._id !== user._id && (
                              <p className="font-semibold text-xs mb-1">
                                {message.sender.name}
                              </p>
                            )}
                            <p>{message.message}</p>
                            <div
                              className={`flex items-center justify-end mt-1 space-x-1 text-xs ${
                                message.sender._id === user._id
                                  ? "text-indigo-200"
                                  : "text-gray-400"
                              }`}
                            >
                              <span>
                                {format(new Date(message.createdAt), "h:mm a")}
                              </span>
                              {message.sender._id === user._id && (
                                <BsCheck2All className="text-xs" />
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex items-center gap-2">
                  
                  <input
                    type="text"
                    placeholder={`Message #${selectedCommunity.name}`}
                    className="flex-1 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className={`p-3 rounded-lg flex items-center justify-center ${
                      newMessage.trim()
                        ? "bg-indigo-500 text-white hover:bg-indigo-600"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    } transition-colors`}
                  >
                    <FaPaperPlane />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
              <div className="bg-indigo-100 p-6 rounded-full mb-4">
                <FaHashtag className="text-3xl text-indigo-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Select a community
              </h3>
              <p className="text-gray-500 max-w-md">
                Choose a community from the sidebar to start chatting with other
                members.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;
