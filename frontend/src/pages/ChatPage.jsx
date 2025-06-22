import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { toast } from "react-toastify";
import Navbar from "../components/Header";
import { ToastContainer } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUserCircle,
  FaPaperPlane,
  FaSearch,
  FaEllipsisV,
  FaComments,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { BsCheck2All, BsCheck2 } from "react-icons/bs";
import { format } from "date-fns";

const socket = io("http://localhost:5000");

const ChatPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user"));
  const id = user?._id;
  const [userData, setUserData] = useState(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch user data and friends
  const fetchUserData = async () => {
    try {
      const { data } = await axios.post(
        "http://localhost:5000/api/user/singleUser",
        { id },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setUserData(data);
      const friends = data.friends || [];
      setUsers(friends);
      setFilteredUsers(friends);
    } catch (error) {
      toast.error("Error fetching user data");
    }
  };

  useEffect(() => {
    fetchUserData();

    // Socket setup
    socket.emit("joinUser", user._id);

    // Listen for incoming messages
    socket.on("receivePrivateMessage", (message) => {
      if (message.sender === selectedUser?.friend?._id) {
        setMessages((prev) => [...prev, message]);
      }
    });

    // Listen for typing events
    socket.on("typing", (userId) => {
      if (userId === selectedUser?.friend?._id) {
        setIsTyping(true);
        const timer = setTimeout(() => setIsTyping(false), 2000);
        return () => clearTimeout(timer);
      }
    });

    return () => {
      socket.off("receivePrivateMessage");
      socket.off("typing");
    };
  }, [selectedUser]);

  // Filter users based on search
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (user) =>
          user.friend.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.friend.anonymousName
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  // Categorize friends into visible and anonymous names
  const categorizedFriends = filteredUsers.reduce(
    (acc, friend) => {
      if (friend.showName) {
        acc.visibleNames.push(friend);
      } else {
        acc.anonymousNames.push(friend);
      }
      return acc;
    },
    { visibleNames: [], anonymousNames: [] }
  );

  // Fetch chat history when a user is selected
  const loadMessages = async (friendId) => {
    try {
      const userToSelect = users.find((u) => u.friend._id === friendId);
      setSelectedUser(userToSelect);
      const res = await axios.post(
        `http://localhost:5000/api/messages/${friendId}`,
        { userId: user?._id },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setMessages(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Error loading chat history");
    }
  };

  const toggleMyNameVisibility = async (value) => {
    try {
      await axios.post(
        `http://localhost:5000/api/user/toggle-name`,
        {
          userId: id,
          friendId: selectedUser.friend._id,
          value: value, // true or false
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      await fetchUserData(); // Refresh updated friend info
      toast.success("Your name visibility to this friend updated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update name visibility");
    }
  };

  const getDisplayName = (friendData) => {
    // Always show your own real name to yourself
    if (friendData._id == user._id) {
      return user.name;
    }

    // For friends' names (what you see)
    const friendEntry = userData?.friends?.find(
      (f) => f.friend._id == friendData._id
    );

    // Use showTheirName to determine if you should see their real name
    return friendEntry?.showName ? friendData.name : friendData.anonymousName;
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const messageData = {
        sender: user._id,
        receiver: selectedUser.friend._id,
        message: newMessage,
        timestamp: new Date(),
      };

      socket.emit("sendPrivateMessage", messageData);
      setMessages([...messages, messageData]);
      setNewMessage("");
    } catch (error) {
      toast.error("Error sending message");
    }
  };

  // Handle typing indicator
  const handleTyping = () => {
    socket.emit("typing", selectedUser.friend._id);
  };

  return (
    <>
      <Navbar />
      <div
        className="bg-gray-100 min-h-screen flex"
        style={{ height: "calc(100vh - 64px)" }}
      >
        <ToastContainer position="top-right" autoClose={3000} />

        {/* Sidebar - Friends List */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-80 bg-white border-r border-gray-200 flex flex-col"
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 bg-indigo-600 text-white">
            <h2 className="text-xl font-bold">Friends</h2>
          </div>

          {/* Search Bar */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search friends..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Friends List */}
          <div className="flex-1 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchTerm
                  ? "No matching friends found"
                  : "You haven't added any friends yet"}
              </div>
            ) : (
              <div>
                {/* Section for friends with visible names */}
                {categorizedFriends.visibleNames.length > 0 && (
                  <div className="px-3 pt-3">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Visible Names
                    </div>
                    <div className="divide-y divide-gray-100">
                      {categorizedFriends.visibleNames.map((u) => (
                        <motion.div
                          key={u.friend._id}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          className={`p-3 flex items-center gap-3 cursor-pointer transition-colors ${
                            selectedUser?.friend?._id === u.friend._id
                              ? "bg-indigo-50"
                              : "hover:bg-gray-50"
                          }`}
                          onClick={() => loadMessages(u.friend._id)}
                        >
                          <div className="relative">
                            <FaUserCircle className="text-3xl text-indigo-500" />
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <h3 className="font-semibold text-gray-800 truncate">
                                {u.friend.name}
                              </h3>
                              <span className="text-xs text-gray-500">
                                {u.lastSeen
                                  ? format(new Date(u.lastSeen), "HH:mm")
                                  : ""}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 truncate">
                              {u.lastMessage || "Start a conversation"}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section for friends with anonymous names */}
                {categorizedFriends.anonymousNames.length > 0 && (
                  <div className="px-3 pt-3">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Anonymous Names
                    </div>
                    <div className="divide-y divide-gray-100">
                      {categorizedFriends.anonymousNames.map((u) => (
                        <motion.div
                          key={u.friend._id}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          className={`p-3 flex items-center gap-3 cursor-pointer transition-colors ${
                            selectedUser?.friend?._id === u.friend._id
                              ? "bg-indigo-50"
                              : "hover:bg-gray-50"
                          }`}
                          onClick={() => loadMessages(u.friend._id)}
                        >
                          <div className="relative">
                            <FaUserCircle className="text-3xl text-indigo-500" />
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <h3 className="font-semibold text-gray-800 truncate">
                                {u.friend.anonymousName}
                              </h3>
                              <span className="text-xs text-gray-500">
                                {u.lastSeen
                                  ? format(new Date(u.lastSeen), "HH:mm")
                                  : ""}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 truncate">
                              {u.lastMessage || "Start a conversation"}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Chat Section */}
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex-1 flex flex-col bg-white"
        >
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-indigo-50 h-16">
                <div className="flex items-center gap-3">
                  <FaUserCircle className="text-3xl text-indigo-500" />
                  <div>
                    <h2 className="font-bold text-gray-800">
                      {getDisplayName(selectedUser.friend)}
                    </h2>
                    <AnimatePresence>
                      {isTyping ? (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-xs text-gray-500"
                        >
                          typing...
                        </motion.p>
                      ) : (
                        <p className="text-xs text-gray-500">Online</p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      toggleMyNameVisibility(
                        !userData?.friends?.find(
                          (f) => f.friend._id === selectedUser.friend._id
                        )?.showMyName
                      )
                    }
                    className="flex items-center gap-1 text-xs bg-indigo-100 hover:bg-indigo-200 px-2 py-1 rounded"
                  >
                    {userData?.friends?.find(
                      (f) => f.friend._id === selectedUser.friend._id
                    )?.showMyName ? (
                      <>
                        <FaEyeSlash className="text-indigo-600" />
                        <span>Hide My Name</span>
                      </>
                    ) : (
                      <>
                        <FaEye className="text-indigo-600" />
                        <span>Show My Name</span>
                      </>
                    )}
                  </button>

                  <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
                    <FaEllipsisV />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div
                className="flex-1 overflow-y-auto bg-gray-50"
                style={{ maxHeight: "calc(100vh - 64px - 64px - 72px)" }}
              >
                <div className="p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <FaComments className="text-4xl mb-2" />
                      <p>No messages yet</p>
                      <p className="text-sm">
                        Start a conversation with{" "}
                        {getDisplayName(selectedUser.friend)}
                      </p>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isCurrentUser = msg.sender === user._id;
                      const sender = isCurrentUser
                        ? user
                        : users.find((u) => u.friend._id === msg.sender)
                            ?.friend || selectedUser.friend;

                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className={`flex ${
                            isCurrentUser ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div className="flex flex-col max-w-xs lg:max-w-md">
                            {!isCurrentUser && (
                              <div className="text-xs text-gray-500 mb-1">
                                {getDisplayName(sender)}
                              </div>
                            )}
                            <div
                              className={`px-4 py-2 rounded-lg ${
                                isCurrentUser
                                  ? "bg-indigo-500 text-white rounded-tr-none"
                                  : "bg-white text-gray-800 rounded-tl-none shadow-sm"
                              }`}
                            >
                              <p>{msg.message}</p>
                              <div
                                className={`flex items-center justify-end mt-1 space-x-1 text-xs ${
                                  isCurrentUser
                                    ? "text-indigo-200"
                                    : "text-gray-400"
                                }`}
                              >
                                <span>
                                  {format(new Date(msg.timestamp), "HH:mm")}
                                </span>
                                {isCurrentUser && (
                                  <span>
                                    {msg.read ? (
                                      <BsCheck2All className="text-blue-300" />
                                    ) : (
                                      <BsCheck2 />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Message Input */}
              <div className="p-3 border-t border-gray-200 bg-white h-20">
                <div className="flex items-center gap-2 h-full">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    className="flex-1 p-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className={`p-3 rounded-full flex items-center justify-center ${
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
                <FaComments className="text-4xl text-indigo-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Select a chat
              </h3>
              <p className="text-gray-500 max-w-md">
                Choose a user from the sidebar to start chatting or search for
                someone to connect with.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
};

export default ChatPage;
