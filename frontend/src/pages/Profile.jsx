import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import axios from "axios";
import {
  FiEdit,
  FiTrash2,
  FiPlus,
  FiCheck,
  FiLoader,
  FiCamera,
} from "react-icons/fi";

const Profile = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const id = user?._id;
  const [userData, setUserData] = useState(null);
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(false);
  const [editImage, setEditImage] = useState(false);

  const [editData, setEditData] = useState({
    name: "",
    email: "",
    profilePicture: "",
  });

  const getSingleUser = async () => {
    try {
      setLoading(true);
      const { data } = await axios.post(
        "http://localhost:5000/api/user/singleUser",
        { id }
      );
      setUserData(data);
      setGoals(data.goals || []);
      setEditData({
        name: data.name,
        email: data.email,
        profilePicture: data.profilePicture || "",
      });
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const addGoal = async () => {
    if (!newGoal.trim()) return;
    try {
      await axios.post("http://localhost:5000/api/user/goal/add", {
        userId: id,
        goal: newGoal,
      });
      setNewGoal("");
      getSingleUser();
    } catch (error) {
      console.log(error);
    }
  };

  const deleteGoal = async (goal) => {
    try {
      await axios.post(`http://localhost:5000/api/user/goal/delete`, {
        userId: id,
        goal,
      });
      getSingleUser();
    } catch (error) {
      console.log(error);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size too large (max 5MB)");
      return;
    }

    // Check file type
    if (!file.type.match(/image.(jpeg|jpg|png|gif)$/)) {
      alert("Please upload a valid image file (JPEG, JPG, PNG, GIF)");
      return;
    }

    setImageLoading(true);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setEditData((prev) => ({
        ...prev,
        profilePicture: reader.result,
      }));
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "your_upload_preset"); // Replace with your upload preset
    formData.append("cloud_name", "your_cloud_name"); // Replace with your cloud name

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/your_cloud_name/image/upload`,
        formData
      );

      setEditData((prev) => ({
        ...prev,
        profilePicture: response.data.secure_url,
      }));
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("Failed to upload image. Please try again.");
    } finally {
      setImageLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      await axios.put(`http://localhost:5000/api/user/update`, {
        userId: id,
        name: editData.name,
        email: editData.email,
        profilePicture: editData.profilePicture,
      });
      setIsEditing(false);
      setEditImage(false);
      getSingleUser();
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getSingleUser();
  }, []);

  if (loading || !userData) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-100">
        <FiLoader className="animate-spin text-indigo-600 text-4xl mt-4" />
        <p className="mt-2 text-gray-600">Fetching profile...</p>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Profile Header */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
            <div className="md:flex">
              <div className="md:flex-shrink-0 bg-gradient-to-r from-purple-500 to-indigo-600 md:w-48 flex items-center justify-center relative">
                {isEditing && editImage ? (
                  <div className="p-4 w-full h-full flex flex-col items-center justify-center">
                    <label className="cursor-pointer">
                      <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {editData.picture ? (
                          <img
                            src={editData.picture}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FiCamera className="text-gray-400 text-4xl" />
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleImageUpload}
                        accept="image/*"
                      />
                    </label>
                    {imageLoading && (
                      <div className="mt-2 flex items-center">
                        <FiLoader className="animate-spin mr-2" />
                        <span className="text-white text-sm">Uploading...</span>
                      </div>
                    )}
                    <button
                      onClick={() => setEditImage(false)}
                      className="mt-2 text-white text-sm hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="p-8 text-white text-center">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mx-auto mb-4">
                        {userData.picture ? (
                          <img
                            src={userData.picture}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-indigo-400 flex items-center justify-center">
                            <span className="text-4xl font-bold text-white">
                              {userData.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      {isEditing && (
                        <button
                          onClick={() => setEditImage(true)}
                          className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md text-indigo-600 hover:bg-gray-100 transition duration-200"
                        >
                          <FiCamera />
                        </button>
                      )}
                    </div>
                    <div className="uppercase tracking-wide text-sm font-semibold">
                      Member Since
                    </div>
                    <div className="mt-1 text-sm">
                      {new Date(userData.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-8 w-full">
                <div className="flex justify-between items-start">
                  <div>
                    {isEditing ? (
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={editData.name}
                          onChange={(e) =>
                            setEditData({ ...editData, name: e.target.value })
                          }
                          className="text-2xl font-bold text-gray-800 mb-2 border-b border-gray-300 focus:outline-none focus:border-indigo-500 w-full"
                        />
                        <input
                          type="email"
                          value={editData.email}
                          onChange={(e) =>
                            setEditData({ ...editData, email: e.target.value })
                          }
                          className="text-gray-600 mb-4 border-b border-gray-300 focus:outline-none focus:border-indigo-500 w-full"
                        />
                      </div>
                    ) : (
                      <>
                        <h1 className="text-2xl font-bold text-gray-800">
                          {userData.name}
                        </h1>
                        <p className="text-gray-600">{userData.email}</p>
                      </>
                    )}
                  </div>
                  <div>
                    
                  </div>
                </div>

                <div className="mt-6 flex space-x-6">
                  <div className="text-center">
                    <p className="text-gray-500">Friends</p>
                    <p className="text-2xl font-semibold text-indigo-600">
                      {userData.friends?.length || 0}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500">Goals</p>
                    <p className="text-2xl font-semibold text-indigo-600">
                      {goals.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Goals Section */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Your Goals</h2>
                <div className="flex">
                  <input
                    type="text"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    placeholder="Add a new goal..."
                    className="px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === "Enter" && addGoal()}
                  />
                  <button
                    onClick={addGoal}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700 transition duration-200 flex items-center"
                  >
                    <FiPlus className="mr-1" /> Add
                  </button>
                </div>
              </div>

              {goals.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    You haven't set any goals yet. Add one to get started!
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {goals.map((goal, index) => (
                    <li
                      key={index}
                      className="py-4 flex justify-between items-center"
                    >
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-indigo-500 mr-3"></div>
                        <p className="text-gray-800">{goal}</p>
                      </div>
                      <button
                        onClick={() => deleteGoal(goal)}
                        className="text-red-500 hover:text-red-700 transition duration-200"
                      >
                        <FiTrash2 />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
