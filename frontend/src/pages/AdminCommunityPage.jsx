import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Navbar from "../components/Header";
import { ToastContainer } from "react-toastify";
import Select from "react-select";
import { FiPlus, FiUsers, FiHome, FiChevronDown } from "react-icons/fi";

const AdminCommunityPage = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [residents, setResidents] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("create");
  const user = JSON.parse(localStorage.getItem("user"));
  const id = user?._id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        const [residentsRes, communitiesRes] = await Promise.all([
          axios.get("http://localhost:5000/api/user/all", {
            headers: { Authorization: token },
          }),
          axios.post("http://localhost:5000/api/communities/all", { id }),
        ]);

        setResidents(
          residentsRes.data.map((resident) => ({
            value: resident._id,
            label: resident.name,
          }))
        );

        setCommunities(communitiesRes.data);
      } catch (error) {
        toast.error("Error fetching data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const createCommunity = async () => {
    if (!name.trim()) {
      toast.error("Community name is required");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/communities",
        { name, description, admin: id },
        { headers: { Authorization: token } }
      );
      toast.success("Community created successfully!");
      setName("");
      setDescription("");
      setCommunities([...communities, res.data]);
      setActiveTab("manage"); // Switch to manage tab after creation
    } catch (error) {
      toast.error(error.response?.data?.message || "Error creating community");
    } finally {
      setLoading(false);
    }
  };

  const addUsersToCommunity = async () => {
    if (!selectedCommunity) {
      toast.error("Please select a community first");
      return;
    }
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const userIds = selectedUsers.map((user) => user.value);
      await axios.post(
        `http://localhost:5000/api/communities/${selectedCommunity}/add-users`,
        { userIds, id },
        { headers: { Authorization: token } }
      );
      toast.success("Users added to community successfully!");
      setSelectedUsers([]);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Error adding users to community"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Navbar />
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Community Management
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Create and manage communities with ease
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex rounded-lg bg-white shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => setActiveTab("create")}
              className={`px-6 py-3 text-sm font-medium flex items-center space-x-2 ${
                activeTab === "create"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <FiPlus className="h-4 w-4" />
              <span>Create Community</span>
            </button>
            <button
              onClick={() => setActiveTab("manage")}
              className={`px-6 py-3 text-sm font-medium flex items-center space-x-2 ${
                activeTab === "manage"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <FiUsers className="h-4 w-4" />
              <span>Manage Members</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          {/* Create Community Tab */}
          {activeTab === "create" && (
            <div className="p-8">
              <div className="flex items-center mb-6">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                  <FiHome className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Create New Community
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Community Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Oakwood Residences"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    placeholder="Brief description about the community..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={createCommunity}
                    disabled={loading}
                    className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition duration-150 ease-in-out disabled:opacity-50 flex items-center justify-center"
                  >
                    {loading ? (
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    ) : (
                      <FiPlus className="mr-2" />
                    )}
                    Create Community
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Manage Community Tab */}
          {activeTab === "manage" && (
            <div className="p-8">
              <div className="flex items-center mb-6">
                <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
                  <FiUsers className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Add Members to Community
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Community *
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCommunity || ""}
                      onChange={(e) => setSelectedCommunity(e.target.value)}
                      className="appearance-none w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition pr-10"
                    >
                      <option value="" disabled>
                        Choose a community...
                      </option>
                      {communities.map((community) => (
                        <option key={community._id} value={community._id}>
                          {community.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <FiChevronDown className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Members to Add *
                  </label>
                  <Select
                    isMulti
                    options={residents}
                    value={selectedUsers}
                    onChange={setSelectedUsers}
                    placeholder="Search and select friends..."
                    className="react-select-container"
                    classNamePrefix="react-select"
                    isLoading={loading}
                    noOptionsMessage={() => "No residents found"}
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={addUsersToCommunity}
                    disabled={
                      loading ||
                      !selectedCommunity ||
                      selectedUsers.length === 0
                    }
                    className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {loading ? (
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    ) : (
                      <FiUsers className="mr-2" />
                    )}
                    Add Selected Members
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCommunityPage;
