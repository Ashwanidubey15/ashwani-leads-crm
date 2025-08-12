"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface UserNumber {
  id: string;
  number: string;
  label: string;
  purpose: string;
  createdAt: string;
  assistant?: {
    id: string;
    name: string;
    description: string;
  };
}

interface Assistant {
  id: string;
  name: string;
  description: string;
  firstMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function PhoneNumbersPage() {
  const { data: session } = useSession();
  const [userNumbers, setUserNumbers] = useState<UserNumber[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [suggestedAreaCodes, setSuggestedAreaCodes] = useState<string[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<UserNumber | null>(null);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [areaCode, setAreaCode] = useState("555");
  const [label, setLabel] = useState("Business Line");
  const [selectedAssistantId, setSelectedAssistantId] = useState("");

  // Auto-dismiss messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
        setSuggestedAreaCodes([]);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Fetch user's existing numbers
  async function fetchUserNumbers() {
    try {
      const res = await fetch("/api/user-numbers");
      if (!res.ok) {
        throw new Error("Failed to fetch user numbers");
      }
      const data = await res.json();
      setUserNumbers(data);
    } catch (error: any) {
      setError(error.message);
    }
  }

  // Fetch user's assistants
  async function fetchAssistants() {
    try {
      const res = await fetch("/api/assistants");
      if (!res.ok) {
        throw new Error("Failed to fetch assistants");
      }
      const data = await res.json();
      setAssistants(data);
    } catch (error: any) {
      console.error("Failed to fetch assistants:", error);
    }
  }

  // Purchase a number directly from Vapi
  async function handlePurchase() {
    if (!areaCode.trim()) {
      setError("Please enter an area code");
      return;
    }

    if (!label.trim()) {
      setError("Please enter a label for your phone number");
      return;
    }

    if (!selectedAssistantId) {
      setError("Please select an assistant for this phone number");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setSuggestedAreaCodes([]);
    
    try {
      const res = await fetch("/api/user-numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          areaCode: areaCode.trim(),
          label: label.trim(), 
          purpose: "inbound",
          assistantId: selectedAssistantId
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        
        // Check if we have suggested area codes
        if (errorData.suggestedAreaCodes) {
          setSuggestedAreaCodes(errorData.suggestedAreaCodes);
        }
        
        throw new Error(errorData.message || "Failed to purchase number");
      }

      setSuccess("Phone number purchased successfully!");
      setAreaCode("555");
      setLabel("Business Line");
      setSelectedAssistantId("");
      setShowPurchaseForm(false);
      await fetchUserNumbers();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  // Remove a number
  async function handleRemove(id: string) {
    try {
      const res = await fetch("/api/user-numbers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        throw new Error("Failed to remove number");
      }

      setSuccess("Phone number removed successfully!");
      if (selectedNumber && selectedNumber.id === id) {
        setSelectedNumber(null);
      }
      await fetchUserNumbers();
    } catch (error: any) {
      setError(error.message);
    }
  }

  // Dismiss messages manually
  const dismissMessage = () => {
    setError("");
    setSuccess("");
    setSuggestedAreaCodes([]);
  };

  useEffect(() => {
    if (session) {
      fetchUserNumbers();
      fetchAssistants();
    }
  }, [session]);

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h1>
          <p className="text-gray-600">You need to be signed in to manage phone numbers.</p>
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
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Phone Numbers</h1>
              <p className="mt-1 text-gray-600">Purchase and manage your phone numbers directly from Vapi.</p>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {(error || success) && (
          <div className="mb-6">
            {error && (
              <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl relative shadow-sm">
                <button
                  onClick={dismissMessage}
                  className="absolute top-3 right-3 text-red-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-200"
                  aria-label="Dismiss error message"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <p className="text-red-800 pr-10 font-medium">{error}</p>
                {suggestedAreaCodes.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-red-700 mb-2 font-medium">Try one of these available area codes:</p>
                    <div className="flex gap-2 flex-wrap">
                      {suggestedAreaCodes.map((code) => (
                        <button
                          key={code}
                          onClick={() => setAreaCode(code)}
                          className="px-3 py-1 bg-red-200 text-red-800 rounded-lg text-sm hover:bg-red-300 transition-colors font-medium"
                        >
                          {code}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {success && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl relative shadow-sm">
                <button
                  onClick={dismissMessage}
                  className="absolute top-3 right-3 text-green-400 hover:text-green-600 transition-colors p-1 rounded-full hover:bg-green-200"
                  aria-label="Dismiss success message"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <p className="text-green-800 pr-10 font-medium">{success}</p>
              </div>
            )}
          </div>
        )}

        {/* Purchase Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowPurchaseForm(!showPurchaseForm)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
          >
            {showPurchaseForm ? "Cancel" : "Purchase New Number"}
          </button>
        </div>

        {/* Purchase Form */}
        {showPurchaseForm && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Purchase New Phone Number</h2>
            </div>
            <div className="max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="areaCode" className="block text-sm font-medium text-gray-700 mb-2">
                    Area Code
                  </label>
                  <input
                    type="text"
                    id="areaCode"
                    value={areaCode}
                    onChange={(e) => setAreaCode(e.target.value)}
                    placeholder="e.g., 555, 212, 415"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    maxLength={3}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Enter a 3-digit US area code
                  </p>
                </div>
                <div>
                  <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-2">
                    Label
                  </label>
                  <input
                    type="text"
                    id="label"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g., Business Line, Support, Sales"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Give your phone number a descriptive name
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="assistant" className="block text-sm font-medium text-gray-700 mb-2">
                    Assign to Assistant
                  </label>
                  <select
                    id="assistant"
                    value={selectedAssistantId}
                    onChange={(e) => setSelectedAssistantId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  >
                    <option value="">Select an assistant</option>
                    {assistants.map((assistant) => (
                      <option key={assistant.id} value={assistant.id}>
                        {assistant.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    Choose an assistant to associate this phone number with.
                  </p>
                </div>
              </div>
              <div className="text-center">
                <button
                  onClick={handlePurchase}
                  disabled={loading || !areaCode.trim() || !label.trim() || !selectedAssistantId}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
                >
                  {loading ? "Purchasing..." : "Purchase Phone Number"}
                </button>
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                  {/* <p className="text-sm text-gray-700 font-medium">
                    💰 Cost: $1.99/month • Includes voice and SMS capabilities
                  </p> */}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Phone Numbers List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Your Phone Numbers</h2>
              </div>
              {userNumbers.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto">
                      <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-lg font-medium text-gray-900 mb-2">No phone numbers yet</p>
                  <p className="text-gray-600">Click "Purchase New Number" above to get started.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {userNumbers.map((number) => (
                    <div
                      key={number.id}
                      className={`px-6 py-4 cursor-pointer hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 transition-all duration-200 ${
                        selectedNumber?.id === number.id ? 'bg-gradient-to-r from-purple-50 to-purple-100 border-r-2 border-purple-300' : ''
                      }`}
                      onClick={() => setSelectedNumber(number)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold text-gray-900 truncate">{number.number}</h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {number.label} • {number.purpose}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Added {new Date(number.createdAt).toLocaleDateString()}
                              </p>
                              {number.assistant && (
                                <p className="text-xs text-purple-600 mt-1 font-medium">
                                  Assistant: {number.assistant.name}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(number.id);
                          }}
                          className="text-red-600 hover:text-red-800 text-sm font-medium ml-2 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Phone Number Details */}
          <div className="lg:col-span-2">
            {selectedNumber ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">{selectedNumber.number}</h2>
                        <p className="text-sm text-gray-600">{selectedNumber.label}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(selectedNumber.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium px-4 py-2 rounded-xl hover:bg-red-50 transition-colors border border-red-200 hover:border-red-300"
                    >
                      Remove Number
                    </button>
                  </div>
                </div>
                <div className="px-6 py-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Number Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                          <p className="text-lg font-mono text-gray-900 font-semibold">{selectedNumber.number}</p>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                          <p className="text-lg text-gray-900 font-semibold">{selectedNumber.label}</p>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                          <p className="text-lg text-gray-900 font-semibold capitalize">{selectedNumber.purpose}</p>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Added Date</label>
                          <p className="text-lg text-gray-900 font-semibold">{new Date(selectedNumber.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                    
                    {selectedNumber.assistant && (
                      <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Assigned Assistant</h3>
                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                          <div className="flex items-center gap-4 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900">{selectedNumber.assistant.name}</h4>
                              <p className="text-sm text-gray-600">{selectedNumber.assistant.description}</p>
                            </div>
                          </div>
                          <div className="text-sm text-gray-700">
                            This assistant will handle all incoming and outgoing calls for this phone number.
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Usage Information</h3>
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
                        <p className="text-sm text-gray-700 mb-3 font-medium">
                          This phone number is ready to be used with your AI assistants. You can:
                        </p>
                        <ul className="text-sm text-gray-600 space-y-2">
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            Assign it to an assistant in the Assistants page
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            Use it for incoming and outgoing calls
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            Receive SMS messages
                          </li>
                          {/* <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            Manage it through the Vapi dashboard
                          </li> */}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
                <div className="px-6 py-12 text-center text-gray-500">
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto">
                      <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Phone Number</h3>
                  <p className="text-gray-600">Choose a phone number from the list to view its details and manage it.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 