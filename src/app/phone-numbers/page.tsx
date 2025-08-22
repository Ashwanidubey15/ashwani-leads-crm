"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

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
  const searchParams = useSearchParams();
  const locationIdFromUrl = searchParams?.get("locationId") ?? "";
  const [userNumbers, setUserNumbers] = useState<UserNumber[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [suggestedAreaCodes, setSuggestedAreaCodes] = useState<string[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<UserNumber | null>(null);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  // const [areaCode, setAreaCode] = useState("555");
  const [label, setLabel] = useState("Business Line");
  const [selectedAssistantId, setSelectedAssistantId] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [purchasingNumber, setPurchasingNumber] = useState<string | null>(null);
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [buyStep, setBuyStep] = useState<1 | 2 | 3>(1);
  const [selectedPhoneNumberToBuy, setSelectedPhoneNumberToBuy] = useState<string | null>(null);
  const [endUserType, setEndUserType] = useState<"business" | "individual" | "">("");
  const [addresses, setAddresses] = useState<any[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [selectedAddressSid, setSelectedAddressSid] = useState("");
  const [showCreateAddress, setShowCreateAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    country: "AU",
    customerName: "",
    friendlyName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const [creatingAddress, setCreatingAddress] = useState(false);

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
      const qs = locationIdFromUrl ? `?locationId=${encodeURIComponent(locationIdFromUrl)}` : "";
      const res = await fetch(`/api/user-numbers${qs}`);
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
      const qs = locationIdFromUrl ? `?locationId=${encodeURIComponent(locationIdFromUrl)}` : "";
      const res = await fetch(`/api/assistants${qs}`);
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
    // if (!areaCode.trim()) {
    //   setError("Please enter an area code");
    //   return;
    // }

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
          // areaCode: areaCode.trim(),
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
      // setAreaCode("555");
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

  async function handleSearchNumbers() {
    try {
      setSearching(true);
      setError("");
      setSuccess("");
      const res = await fetch(`/api/twilio/search-numbers?country=AU&type=mobile&limit=20`);
      if (!res.ok) {
        throw new Error("Failed to search numbers");
      }
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length === 0) {
        setSuccess("No numbers found right now. Try again later.");
      }
    } catch (error: any) {
      setError(error.message || "Failed to search numbers");
    } finally {
      setSearching(false);
    }
  }

  async function handleBuyNumber(phoneNumber: string) {
    // Open the modal regardless; we will require assistant before final purchase
    setSelectedPhoneNumberToBuy(phoneNumber);
    setBuyStep(1);
    setEndUserType("");
    setSelectedAddressSid("");
    setShowCreateAddress(false);
    setBuyModalOpen(true);
  }

  async function loadAddresses() {
    try {
      setAddressesLoading(true);
      const res = await fetch("/api/twilio/addresses");
      if (!res.ok) throw new Error("Failed to load addresses");
      const list = await res.json();
      const arr = Array.isArray(list) ? list : [];
      setAddresses(arr);
      if (!selectedAddressSid && arr.length > 0) {
        setSelectedAddressSid(arr[0].sid);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load addresses");
    } finally {
      setAddressesLoading(false);
    }
  }

  async function handleCreateAddress(e: React.FormEvent) {
    e.preventDefault();
    try {
      setCreatingAddress(true);
      const res = await fetch("/api/twilio/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAddress),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to create address");
      }
      const created = await res.json();
      setAddresses([created, ...addresses]);
      setSelectedAddressSid(created.sid);
      setShowCreateAddress(false);
    } catch (e: any) {
      setError(e.message || "Failed to create address");
    } finally {
      setCreatingAddress(false);
    }
  }

  async function finalizePurchase() {
    if (!selectedPhoneNumberToBuy) return;
    try {
      setPurchasingNumber(selectedPhoneNumberToBuy);
      const res = await fetch("/api/twilio/purchase-number", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: selectedPhoneNumberToBuy,
          addressSid: selectedAddressSid || undefined,
          label: label.trim() || "Business Line",
          assistantId: selectedAssistantId,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to purchase number");
      }
      setSuccess("Phone number purchased successfully!");
      setBuyModalOpen(false);
      setShowPurchaseForm(false);
      setSearchResults([]);
      setSelectedAssistantId("");
      await fetchUserNumbers();
    } catch (e: any) {
      setError(e.message || "Failed to purchase number");
    } finally {
      setPurchasingNumber(null);
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
  }, [session, locationIdFromUrl]);

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
                {/* {suggestedAreaCodes.length > 0 && (
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
                )} */}
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
                {/* Country (fixed) */}
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <input
                    id="country"
                    value="Australia (AU)"
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 text-gray-700"
                  />
                  <p className="text-xs text-gray-500 mt-2">Only Australian numbers are supported.</p>
                </div>
                {/* Type (fixed) */}
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <input
                    id="type"
                    value="Mobile"
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 text-gray-700"
                  />
                  <p className="text-xs text-gray-500 mt-2">Searching for mobile numbers.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
              <div className="flex items-center gap-4 mb-2">
                <button
                  onClick={handleSearchNumbers}
                  disabled={searching}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  {searching ? "Searching..." : "Search"}
                </button>
                {searchResults.length > 0 && (
                  <span className="text-sm text-gray-600">{searchResults.length} suggestion{searchResults.length > 1 ? 's' : ''} found</span>
                )}
              </div>
              {searchResults.length > 0 && (
                <div className="mt-4 divide-y divide-gray-200 border border-gray-200 rounded-2xl overflow-hidden">
                  {searchResults.map((item: any, idx: number) => (
                    <div key={item.phoneNumber} className="flex items-center justify-between px-4 py-4 bg-white hover:bg-gray-50">
                      <div className="flex items-start gap-4">
                        <div className="text-base sm:text-lg font-mono text-gray-900 font-semibold">{item.phoneNumber}</div>
                        <div className="text-xs sm:text-sm text-gray-600">
                          <div>{item.locality ? `${item.locality}, ` : ""}{item.region ? `${item.region} AU` : "Australia"}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="hidden sm:inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">Mobile</span>
                        <div className="text-sm text-gray-900 font-semibold">$3.00</div>
                        <button
                          onClick={() => handleBuyNumber(item.phoneNumber)}
                          disabled={!!purchasingNumber}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow"
                        >
                          {purchasingNumber === item.phoneNumber ? "Buying..." : "Buy"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="text-center mt-6">
                {/* <button
                  onClick={handlePurchase}
                  // disabled={loading || !areaCode.trim() || !label.trim() || !selectedAssistantId}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
                >
                  {loading ? "Purchasing..." : "Purchase Phone Number"}
                </button> */}
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                  {/* <p className="text-sm text-gray-700 font-medium">
                    💰 Cost: $1.99/month • Includes voice and SMS capabilities
                  </p> */}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Buy Flow Modal */}
        {buyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setBuyModalOpen(false)}></div>
            <div className="relative bg-white w-full max-w-2xl mx-4 rounded-3xl shadow-2xl ring-1 ring-black/5 transform transition-all duration-300">
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-600 to-indigo-600 rounded-t-3xl">
                <h3 className="text-lg font-semibold text-white">
                  {buyStep === 1 && "Review Phone Number"}
                  {buyStep === 2 && "Select End-User"}
                  {buyStep === 3 && "Assign Address"}
                </h3>
                <button onClick={() => setBuyModalOpen(false)} className="text-white/90 hover:text-white">✕</button>
              </div>
              {/* Body */}
              <div className="px-6 py-6">
                {buyStep === 1 && (
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-extrabold tracking-tight text-gray-900">{selectedPhoneNumberToBuy}</div>
                      <div className="text-gray-900 font-semibold text-lg">$3.00 <span className="text-gray-500 font-normal">monthly fee</span></div>
                    </div>
                    <div className="mt-4 text-sm text-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-4">
                      You'll be charged $3.00 immediately. Afterwards, you'll be charged $3.00/month in addition to usage.
                    </div>
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Capabilities</h4>
                        <ul className="text-sm text-gray-700 space-y-1">
                          <li className="flex items-center gap-2"><span className="w-2 h-2 bg-purple-500 rounded-full"></span> Voice: Receive incoming calls and make outgoing calls.</li>
                          <li className="flex items-center gap-2"><span className="w-2 h-2 bg-purple-500 rounded-full"></span> Fax: Send and receive faxes.</li>
                        </ul>
                      </div>
                      <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Global Routing</h4>
                        <div className="text-sm text-gray-700">
                          Voice and Messaging will be routed to the United States (US1) Region. You can re-route after purchase.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {buyStep === 2 && (
                  <div>
                    <p className="text-sm text-gray-800 mb-4">Who will use {selectedPhoneNumberToBuy}?</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <label className="flex items-start gap-3 p-4 border rounded-2xl cursor-pointer hover:bg-gray-50 shadow-sm">
                        <input type="radio" name="enduser" className="mt-1" checked={endUserType === 'business'} onChange={() => setEndUserType('business')} />
                        <div>
                          <div className="font-semibold text-gray-900">Business</div>
                          <div className="text-sm text-gray-600">A business will make or receive a call with this phone number.</div>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 p-4 border rounded-2xl cursor-pointer hover:bg-gray-50 shadow-sm">
                        <input type="radio" name="enduser" className="mt-1" checked={endUserType === 'individual'} onChange={() => setEndUserType('individual')} />
                        <div>
                          <div className="font-semibold text-gray-900">Individual</div>
                          <div className="text-sm text-gray-600">An individual will make or receive a call with this phone number.</div>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
                {buyStep === 3 && (
                  <div>
                    <p className="text-sm text-gray-800 mb-4">Assign Address for {selectedPhoneNumberToBuy}</p>
                    <div className="mb-3 flex items-center justify-between">
                      <div className="text-sm text-gray-600">Select an existing address or create a new one.</div>
                      <button onClick={() => setShowCreateAddress(!showCreateAddress)} className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                        {showCreateAddress ? 'Use existing' : 'Create an Address'}
                      </button>
                    </div>
                    {!showCreateAddress && (
                      <div>
                        {addressesLoading && <div className="p-4 text-sm text-gray-600">Loading addresses...</div>}
                        {!addressesLoading && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Select Address</label>
                              <select
                                value={selectedAddressSid}
                                onChange={(e) => setSelectedAddressSid(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              >
                                {addresses.map((addr) => (
                                  <option key={addr.sid} value={addr.sid}>
                                    {(addr.friendlyName || addr.customerName)} — {addr.city}, {addr.region}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {selectedAddressSid && (
                              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                {addresses.filter(a => a.sid === selectedAddressSid).map(addr => (
                                  <div key={addr.sid} className="text-sm text-gray-800 space-y-1">
                                    <div className="font-medium">{addr.friendlyName || addr.customerName}</div>
                                    <div>{addr.street}{addr.streetSecondary ? `, ${addr.streetSecondary}` : ''}</div>
                                    <div>{addr.city}, {addr.region} {addr.postalCode}</div>
                                    <div>{addr.isoCountry}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {!addressesLoading && addresses.length === 0 && (
                          <div className="p-4 text-sm text-gray-600">No addresses found. Create a new address.</div>
                        )}
                      </div>
                    )}
                    {showCreateAddress && (
                      <form onSubmit={handleCreateAddress} className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input value={newAddress.customerName} onChange={(e)=>setNewAddress({...newAddress, customerName: e.target.value})} placeholder="Customer Name" className="px-3 py-2 border rounded-lg" required />
                          <input value={newAddress.friendlyName} onChange={(e)=>setNewAddress({...newAddress, friendlyName: e.target.value})} placeholder="Friendly Name" className="px-3 py-2 border rounded-lg" required />
                          <input value={newAddress.addressLine1} onChange={(e)=>setNewAddress({...newAddress, addressLine1: e.target.value})} placeholder="Address Line 1" className="px-3 py-2 border rounded-lg sm:col-span-2" required />
                          <input value={newAddress.addressLine2} onChange={(e)=>setNewAddress({...newAddress, addressLine2: e.target.value})} placeholder="Address Line 2 (optional)" className="px-3 py-2 border rounded-lg sm:col-span-2" />
                          <input value={newAddress.city} onChange={(e)=>setNewAddress({...newAddress, city: e.target.value})} placeholder="City" className="px-3 py-2 border rounded-lg" required />
                          <input value={newAddress.state} onChange={(e)=>setNewAddress({...newAddress, state: e.target.value})} placeholder="State/Region" className="px-3 py-2 border rounded-lg" required />
                          <input value={newAddress.zipCode} onChange={(e)=>setNewAddress({...newAddress, zipCode: e.target.value})} placeholder="Postal Code" className="px-3 py-2 border rounded-lg" required />
                          <input value={newAddress.country} disabled className="px-3 py-2 border rounded-lg" />
                        </div>
                        <div className="flex items-center gap-3 pt-1">
                          <button type="submit" disabled={creatingAddress} className="px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                            {creatingAddress ? 'Creating...' : 'Create Address'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
              {/* Footer */}
              <div className="px-6 py-5 border-t border-gray-100 flex items-center justify-between bg-gray-50 rounded-b-3xl">
                <button onClick={() => {
                  if (buyStep === 1) { setBuyModalOpen(false); }
                  if (buyStep === 2) { setBuyStep(1); }
                  if (buyStep === 3) { setBuyStep(2); }
                }} className="px-4 py-2 rounded-xl border text-gray-700 hover:bg-white">{buyStep === 1 ? 'Cancel' : 'Back'}</button>
                <div className="flex items-center gap-3">
                  {buyStep < 3 && (
                    <button onClick={async () => {
                      if (buyStep === 1) { setBuyStep(2); }
                      else if (buyStep === 2) { if (!endUserType) return; await loadAddresses(); setBuyStep(3); }
                    }}
                      disabled={buyStep === 2 && !endUserType}
                      className="px-5 py-2 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50 shadow">
                      Next
                    </button>
                  )}
                  {buyStep === 3 && (
                    <button onClick={finalizePurchase} disabled={!selectedAssistantId || !selectedAddressSid || !!purchasingNumber} className="px-5 py-2 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50 shadow">
                      {purchasingNumber ? 'Buying...' : `Buy ${selectedPhoneNumberToBuy || ''}`}
                    </button>
                  )}
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