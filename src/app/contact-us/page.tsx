"use client";

import { useEffect, useState } from "react";

interface Contact {
  id: string;
  name: string;
  email?: string | null;
  phoneNumber: string;
  company?: string | null;
  updatedAt: string;
  conversations: Array<{
    id: string;
    createdAt: string;
  }>;
  schedules?: Array<{
    id: string;
    scheduleDate: string;
  }>;
}

export default function ContactUsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/contacts", { cache: "no-store" });
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch contacts");
        const data = await res.json();
        setContacts(data);
      } catch (err: any) {
        setError(err.message || "Failed to load contacts");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading)
    return (
      <div className="p-6 text-center text-gray-600 animate-pulse">
        Loading contacts...
      </div>
    );

  if (error)
    return (
      <div className="p-6 text-center text-red-600 font-medium">{error}</div>
    );

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">
        Our Contacts
      </h1>

      {contacts.length === 0 ? (
        <div className="text-center text-gray-400 mt-12">
          <p className="text-lg">No contacts available right now.</p>
          <p className="mt-2">Please check back later or add new contacts.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {contacts.map((c) => {
            const latestSchedule = c.schedules?.[0]?.scheduleDate ?? null;
            return (
              <div
                key={c.id}
                className="bg-white rounded-xl shadow-lg p-5 border border-gray-200 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-xl text-gray-800">
                    {c.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {c.conversations.length} 💬
                  </div>
                </div>

                <div className="text-gray-500 text-sm mt-1">
                  {c.company || "Independent"}
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">📞</span>
                    <span>{c.phoneNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">✉️</span>
                    <span>{c.email || "Not provided"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">📅</span>
                    <span>
                      {latestSchedule
                        ? new Date(latestSchedule).toLocaleString()
                        : "No schedule"}
                    </span>
                  </div>
                </div>

                <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                  View Details
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
