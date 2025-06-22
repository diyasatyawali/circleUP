import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import axios from "axios";
import { motion, useAnimation } from "framer-motion";
import {
  FaHeart,
  FaTimes,
  FaBullseye,
  FaUsers,
  FaSpinner,
} from "react-icons/fa";
import { Toaster, toast } from "react-hot-toast";

const Peoples = () => {
  const [allPeople, setAllPeople] = useState([]);
  const [filteredPeople, setFilteredPeople] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const controls = useAnimation();
  const [userId, setUserId] = useState("");
  const [userFriends, setUserFriends] = useState([]);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      const parsedUser = JSON.parse(user);
      setUserId(parsedUser._id);
      setUserFriends(
        parsedUser.friends?.map((friend) => friend.friend._id) || []
      );
    }
    getAllPeople();
  }, []);

  useEffect(() => {
    if (allPeople.length > 0 && userId) {
      const filtered = allPeople.filter((person) => {
        // Exclude current user
        if (person._id === userId) return false;

        // Exclude already friends
        if (userFriends.includes(person._id)) return false;

        // Exclude people who have the current user as a friend
        if (person.friends?.some((f) => f.friend._id === userId)) return false;

        return true;
      });
      setFilteredPeople(filtered);
      setLoading(false);
    }
  }, [allPeople, userId, userFriends]);

  const getAllPeople = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("http://localhost:5000/api/user/all");
      setAllPeople(data);
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch users");
      setLoading(false);
    }
  };

  const handleSwipe = async (info, id) => {
    const threshold = 100;
    const velocity = info.velocity.x;

    if (velocity > threshold) {
      await controls.start({
        x: "100%",
        opacity: 0,
        transition: { duration: 0.5 },
      });
      try {
        await axios.post("http://localhost:5000/api/user/addFriend", {
          userId: userId,
          id: id,
        });
        toast.success("Friend added successfully");
        setUserFriends([...userFriends, id]);
      } catch (error) {
        console.log("Error adding friend:", error);
        toast.error("Failed to add friend");
      }
      goToNext();
    } else if (velocity < -threshold) {
      await controls.start({
        x: "-100%",
        opacity: 0,
        transition: { duration: 0.5 },
      });
      goToNext();
    } else {
      controls.start({ x: 0, opacity: 1, transition: { duration: 0.5 } });
    }
  };

  const goToNext = () => {
    setTimeout(() => {
      setCurrentIndex((prevIndex) => {
        // If we've reached the end, reset to 0
        if (prevIndex + 1 >= filteredPeople.length) {
          return 0;
        }
        return prevIndex + 1;
      });
      controls.start({ x: 0, opacity: 1 });
    }, 300);
  };

  const currentPerson = filteredPeople[currentIndex];

  const getAvatarColor = (name) => {
    const colors = [
      "bg-gradient-to-r from-purple-400 to-pink-500",
      "bg-gradient-to-r from-blue-400 to-teal-400",
      "bg-gradient-to-r from-orange-400 to-red-500",
      "bg-gradient-to-r from-green-400 to-blue-500",
      "bg-gradient-to-r from-yellow-400 to-orange-500",
    ];
    const hash = name
      .split("")
      .reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    return colors[hash % colors.length];
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 flex flex-col items-center justify-center p-4">
          <FaSpinner className="animate-spin text-5xl text-purple-800" />
          <p className="mt-4 text-purple-800">Loading users...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold text-purple-800 mb-8">
          Discover People
        </h1>

        <div className="relative w-full max-w-md h-96 mb-8">
          {filteredPeople.length > 0 && currentPerson ? (
            <motion.div
              key={currentPerson._id}
              drag="x"
              onDragEnd={(e, info) => handleSwipe(info, currentPerson._id)}
              animate={controls}
              initial={{ x: 0, opacity: 1 }}
              className="absolute w-full h-full bg-white rounded-3xl shadow-xl overflow-hidden"
            >
              <div
                className={`h-3/4 relative flex items-center justify-center ${getAvatarColor(
                  currentPerson.name
                )}`}
              >
                {currentPerson.picture ? (
                  <img
                    src={currentPerson.picture}
                    alt={currentPerson.anonymousName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-white text-4xl font-bold">
                    {currentPerson.anonymousName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="absolute bottom-24 left-4 right-4 p-4 bg-white bg-opacity-90 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {currentPerson.anonymousName}
                  </h2>
                </div>

                {currentPerson.goals && currentPerson.goals.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center text-purple-600 mb-1">
                      <FaBullseye className="mr-2" />
                      <span className="font-semibold">Goals</span>
                    </div>
                    <ul className="list-disc list-inside text-gray-700">
                      {currentPerson.goals.map((goal, index) => (
                        <li key={index} className="text-sm">
                          {goal}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-8">
                <button
                  onClick={() => {
                    controls.start({
                      x: "-100%",
                      opacity: 0,
                      transition: { duration: 0.5 },
                    });
                    goToNext();
                  }}
                  className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center text-red-500 hover:bg-red-50"
                >
                  <FaTimes size={24} />
                </button>

                <button
                  onClick={async () => {
                    await controls.start({
                      x: "100%",
                      opacity: 0,
                      transition: { duration: 0.5 },
                    });
                    try {
                      await axios.post(
                        "http://localhost:5000/api/user/addFriend",
                        {
                          userId: userId,
                          id: currentPerson._id,
                        }
                      );
                      toast.success("Friend added successfully");
                      setUserFriends([...userFriends, currentPerson._id]);
                      window.location.reload()
                    } catch (error) {
                      console.log("Error adding friend:", error);
                      toast.error("Failed to add friend");
                    }
                    goToNext();
                  }}
                  className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center text-green-500 hover:bg-green-50"
                >
                  <FaHeart size={24} />
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="absolute w-full h-full bg-white rounded-3xl shadow-xl flex items-center justify-center">
              <div className="text-center p-6">
                <FaUsers className="mx-auto text-4xl text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700">
                  No more people to show
                </h3>
                <p className="text-gray-500 mt-2">
                  You've seen everyone! Check back later for new connections.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="text-gray-600 text-sm">
          Swipe right to connect or left to pass
        </div>
      </div>
    </>
  );
};

export default Peoples;
