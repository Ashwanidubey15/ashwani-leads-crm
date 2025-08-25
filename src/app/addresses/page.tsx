"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface TwilioAddress {
  sid: string;
  customerName: string;
  friendlyName: string;
  street: string;
  streetSecondary?: string | null;
  city: string;
  region: string;
  postalCode: string;
  isoCountry: string;
  validated?: boolean;
}

export default function AddressesPage() {
  const { data: session, status } = useSession();
  const [addresses, setAddresses] = useState<TwilioAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
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

  useEffect(() => {
    if (!session) return;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/twilio/addresses");
        if (!res.ok) throw new Error("Failed to load addresses");
        const list = await res.json();
        setAddresses(Array.isArray(list) ? list : []);
      } catch (e: any) {
        setError(e.message || "Failed to load addresses");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [session]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      setCreating(true);
      setError("");
      setSuccess("");
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
      setAddresses((prev) => [created, ...prev]);
      setShowCreate(false);
      setNewAddress({
        country: "AU",
        customerName: "",
        friendlyName: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        zipCode: "",
      });
      setSuccess("Address created successfully");
    } catch (e: any) {
      setError(e.message || "Failed to create address");
    } finally {
      setCreating(false);
    }
  }

  if (status === "loading") return null;
  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Addresses</h1>
            <p className="text-gray-600 mt-1">Manage validated addresses for purchasing numbers.</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-5 py-2.5 rounded-xl hover:from-purple-700 hover:to-purple-800 text-sm font-medium shadow-lg hover:shadow-xl transition"
          >
            Create a New Address
          </button>
        </div>

        {(error || success) && (
          <div className="mb-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">{error}</div>
            )}
            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800">{success}</div>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Saved Addresses</h2>
          </div>
          {loading ? (
            <div className="px-6 py-8 text-gray-600">Loading...</div>
          ) : addresses.length === 0 ? (
            <div className="px-6 py-8 text-gray-600">
              No addresses found. Click "Create a New Address" to add one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Friendly Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validated</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {addresses.map((a) => (
                    <tr key={a.sid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-purple-700 font-medium">{a.friendlyName || a.customerName}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{a.isoCountry}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div>{a.street}{a.streetSecondary ? `, ${a.streetSecondary}` : ""}</div>
                        <div>{a.city}, {a.region} {a.postalCode}</div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {a.validated ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">Yes</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowCreate(false)} />
            <div className="relative bg-white w-full max-w-2xl mx-4 rounded-3xl shadow-2xl ring-1 ring-black/5">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-600 to-indigo-600 rounded-t-3xl">
                <h3 className="text-lg font-semibold text-white">Create an address</h3>
                <button onClick={() => setShowCreate(false)} className="text-white/90 hover:text-white">✕</button>
              </div>
              <form onSubmit={handleCreate} className="px-6 py-6 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input value={newAddress.customerName} onChange={(e)=>setNewAddress({...newAddress, customerName: e.target.value})} placeholder="Customer or business name" className="px-3 py-2 border rounded-lg" required />
                  <input value={newAddress.friendlyName} onChange={(e)=>setNewAddress({...newAddress, friendlyName: e.target.value})} placeholder="Address friendly name" className="px-3 py-2 border rounded-lg" required />
                  <input value={newAddress.addressLine1} onChange={(e)=>setNewAddress({...newAddress, addressLine1: e.target.value})} placeholder="Address line 1" className="px-3 py-2 border rounded-lg sm:col-span-2" required />
                  <input value={newAddress.addressLine2} onChange={(e)=>setNewAddress({...newAddress, addressLine2: e.target.value})} placeholder="Address line 2 (optional)" className="px-3 py-2 border rounded-lg sm:col-span-2" />
                  <input value={newAddress.city} onChange={(e)=>setNewAddress({...newAddress, city: e.target.value})} placeholder="City" className="px-3 py-2 border rounded-lg" required />
                  <input value={newAddress.state} onChange={(e)=>setNewAddress({...newAddress, state: e.target.value})} placeholder="State/Region" className="px-3 py-2 border rounded-lg" required />
                  <input value={newAddress.zipCode} onChange={(e)=>setNewAddress({...newAddress, zipCode: e.target.value})} placeholder="Postal code" className="px-3 py-2 border rounded-lg" required />
                  <input value={newAddress.country} onChange={(e)=>setNewAddress({...newAddress, country: e.target.value})} placeholder="Country code (e.g. AU)" className="px-3 py-2 border rounded-lg" required />
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl border text-gray-700 hover:bg-white">Cancel</button>
                  <button type="submit" disabled={creating} className="px-5 py-2 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50">
                    {creating ? "Creating..." : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 