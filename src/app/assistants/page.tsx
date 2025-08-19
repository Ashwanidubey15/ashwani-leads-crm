"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

interface Assistant {
  id: string;
  name: string;
  description: string;
  firstMessage?: string;
  phoneNumbers?: Array<{
    id: string;
    number: string;
    label: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function AssistantsPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const locationIdFromUrl = (searchParams?.get("locationId") ?? "");
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    firstMessage: "",
  });
  const [newAssistant, setNewAssistant] = useState({
    name: "",
    description: "",
    firstMessage: "",
    locationId: "",
  });
  const [locations, setLocations] = useState<any[]>([]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch("/api/locations");
        if (!res.ok) throw new Error("Failed to fetch locations");
        const data = await res.json();

        // Ensure it's stored as an array
        const list = data.data || [];
        setLocations(list);

        if (locationIdFromUrl) {
          setNewAssistant((prev) => ({ ...prev, locationId: locationIdFromUrl }));
        } else if (list.length > 0 && !newAssistant.locationId) {
          setNewAssistant((prev) => {
            return { ...prev, locationId: list[0].id };
          });
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };

    fetchLocations();
  }, [locationIdFromUrl]); // 👈 ensure reacts to URL changes

  // Fetch user's assistants
  async function fetchAssistants(locationId?: string) {
    try {
      let url = "/api/assistants";
      if (locationId) {
        url += `?locationId=${locationId}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to fetch assistants");
      }
      const data = await res.json();
      setAssistants(data);
    } catch (error: any) {
      setError(error.message);
    }
  }

  // Start editing an assistant
  function startEditing(assistant: Assistant) {
    setEditForm({
      name: assistant.name,
      description: assistant.description,
      firstMessage: assistant.firstMessage || "",
    });
    setIsEditing(true);
  }

  // Cancel editing
  function cancelEditing() {
    setIsEditing(false);
    setEditForm({
      name: "",
      description: "",
      firstMessage: "",
    });
  }

  // Save assistant changes
  async function handleSaveAssistant() {
    if (!selectedAssistant || !editForm.name.trim()) {
      setError("Please enter an assistant name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/assistants/${selectedAssistant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          firstMessage: editForm.firstMessage || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update assistant");
      }

      const updatedAssistant = await res.json();
      await fetchAssistants(locationIdFromUrl || undefined);
      setSelectedAssistant(updatedAssistant);
      setIsEditing(false);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  // Create a new assistant
  async function handleCreateAssistant() {
    if (!newAssistant.name.trim()) {
      setError("Please enter an assistant name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        ...newAssistant,
        locationId: newAssistant.locationId || locationIdFromUrl || undefined,
      } as any;

      const res = await fetch("/api/assistants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create assistant");
      }

      await fetchAssistants(locationIdFromUrl || undefined);
      setNewAssistant({
        name: "",
        description: "",
        firstMessage: "",
        locationId: locationIdFromUrl || "",
      });

      setShowCreateForm(false);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  // Delete an assistant
  async function handleDeleteAssistant(id: string) {
    if (!confirm("Are you sure you want to delete this assistant?")) {
      return;
    }

    try {
      const res = await fetch(`/api/assistants/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete assistant");
      }

      await fetchAssistants(locationIdFromUrl || undefined);
      if (selectedAssistant && selectedAssistant.id === id) {
        setSelectedAssistant(null);
      }
    } catch (error: any) {
      setError(error.message);
    }
  }

  useEffect(() => {
    if (session) {
      fetchAssistants(locationIdFromUrl || undefined);
    }
  }, [session, locationIdFromUrl]);

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Please sign in
          </h1>
          <p className="text-gray-600">
            You need to be signed in to manage assistants.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                AI Assistants
              </h1>
              <p className="mt-1 text-gray-600">
                Create and manage your AI assistants with phone number
                integration.
              </p>
            </div>
          </div>
        </div>

        {/* Create Assistant Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
          >
            {showCreateForm ? "Cancel" : "Create New Assistant"}
          </button>
        </div>

        {/* Create Assistant Form */}
        {showCreateForm && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Create New Assistant
              </h2>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Assistant Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={newAssistant.name}
                    onChange={(e) =>
                      setNewAssistant({ ...newAssistant, name: e.target.value })
                    }
                    placeholder="e.g., Customer Support, Sales Assistant"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  />
                </div>
                <div>
                  <label
                    htmlFor="firstMessage"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    First Message (Greeting)
                  </label>
                  <input
                    type="text"
                    id="firstMessage"
                    value={newAssistant.firstMessage}
                    onChange={(e) =>
                      setNewAssistant({
                        ...newAssistant,
                        firstMessage: e.target.value,
                      })
                    }
                    placeholder="e.g., Hello! I'm your AI assistant. How can I help you today?"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Description & Instructions
                </label>
                <textarea
                  id="description"
                  value={newAssistant.description}
                  onChange={(e) =>
                    setNewAssistant({
                      ...newAssistant,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe how your assistant should behave, what it should know, and how it should respond to users..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  This will be used as the system prompt for your AI assistant.
                  Be detailed about its role, knowledge, and behavior.
                </p>
              </div>
              <div className="text-center">
                <button
                  onClick={handleCreateAssistant}
                  disabled={
                    loading ||
                    !newAssistant.name.trim() ||
                    !newAssistant.description.trim()
                  }
                  className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
                >
                  {loading ? "Creating..." : "Create Assistant"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl shadow-sm">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Assistants List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">
                  Your Assistants
                </h2>
              </div>
              {assistants.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto">
                      <svg
                        className="h-8 w-8 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  </div>
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    No assistants yet
                  </p>
                  <p className="text-gray-600">
                    Click "Create New Assistant" above to get started.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {assistants.map((assistant) => (
                    <div
                      key={assistant.id}
                      className={`px-6 py-4 cursor-pointer hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 transition-all duration-200 ${
                        selectedAssistant?.id === assistant.id
                          ? "bg-gradient-to-r from-purple-50 to-purple-100 border-r-2 border-purple-300"
                          : ""
                      }`}
                      onClick={() => setSelectedAssistant(assistant)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                                <svg
                                  className="w-5 h-5 text-purple-600"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold text-gray-900 truncate">
                                {assistant.name}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {assistant.phoneNumbers &&
                                assistant.phoneNumbers.length > 0
                                  ? `📞 ${assistant.phoneNumbers[0].number} (${assistant.phoneNumbers[0].label})`
                                  : "No phone number assigned"}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Created{" "}
                                {new Date(
                                  assistant.createdAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAssistant(assistant.id);
                          }}
                          className="text-red-600 hover:text-red-800 text-sm font-medium ml-2 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Assistant Details */}
          <div className="lg:col-span-2">
            {selectedAssistant ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-purple-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          {selectedAssistant.name}
                        </h2>
                        <p className="text-sm text-gray-600">
                          {selectedAssistant.phoneNumbers &&
                          selectedAssistant.phoneNumbers.length > 0
                            ? `📞 ${selectedAssistant.phoneNumbers[0].number} (${selectedAssistant.phoneNumbers[0].label})`
                            : "No phone number assigned"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => startEditing(selectedAssistant)}
                      className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-xl hover:from-purple-700 hover:to-purple-800 text-sm font-medium transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
                    >
                      Edit
                    </button>
                  </div>
                </div>
                <div className="px-6 py-6">
                  {isEditing ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label
                            htmlFor="editName"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Assistant Name
                          </label>
                          <input
                            type="text"
                            id="editName"
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm({ ...editForm, name: e.target.value })
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="editFirstMessage"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            First Message (Greeting)
                          </label>
                          <input
                            type="text"
                            id="editFirstMessage"
                            value={editForm.firstMessage}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                firstMessage: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          htmlFor="editDescription"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Description & Instructions
                        </label>
                        <textarea
                          id="editDescription"
                          value={editForm.description}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              description: e.target.value,
                            })
                          }
                          rows={6}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={handleSaveAssistant}
                          className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 font-medium transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 font-medium transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                          Assistant Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Name
                            </label>
                            <p className="text-lg text-gray-900 font-semibold">
                              {selectedAssistant.name}
                            </p>
                          </div>
                          <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Phone Number
                            </label>
                            <p className="text-lg text-gray-900 font-semibold">
                              {selectedAssistant.phoneNumbers &&
                              selectedAssistant.phoneNumbers.length > 0
                                ? `${selectedAssistant.phoneNumbers[0].number} (${selectedAssistant.phoneNumbers[0].label})`
                                : "Not assigned"}
                            </p>
                          </div>
                          <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              First Message
                            </label>
                            <p className="text-lg text-gray-900 font-semibold">
                              {selectedAssistant.firstMessage || "Not set"}
                            </p>
                          </div>
                          <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Created
                            </label>
                            <p className="text-lg text-gray-900 font-semibold">
                              {new Date(
                                selectedAssistant.createdAt
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                          Description & Instructions
                        </h3>
                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
                          <p className="text-gray-700 whitespace-pre-wrap">
                            {selectedAssistant.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
                <div className="px-6 py-12 text-center text-gray-500">
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto">
                      <svg
                        className="h-8 w-8 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select an Assistant
                  </h3>
                  <p className="text-gray-600">
                    Choose an assistant from the list to view its details and
                    manage it.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
