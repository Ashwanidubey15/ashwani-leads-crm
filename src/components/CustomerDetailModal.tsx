import React, { useEffect, useState } from "react";
import { Mail, Phone, Building2, Calendar, X } from "lucide-react";

interface CustomerDetailModalProps {
  open: boolean;
  contactId: string;
  onClose: () => void;
}

interface CustomerDetail {
  name: string;
  email?: string | null;
  phoneNumber: string;
  company?: string | null;
  schedules?: { id: string; scheduleDate: string }[];
}

function CustomerDetailModal({ open, onClose, contactId }: CustomerDetailModalProps) {
  const [detail, setDetail] = useState<CustomerDetail | null>(null);

  useEffect(() => {
    if (!contactId || !open) return;

    const fetchDetail = async () => {
      try {
        const response = await fetch(`/api/contacts/${contactId}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to fetch contact");
        const data = await response.json();
        setDetail(data);
      } catch (err) {
        console.error("Error fetching contact details:", err);
        setDetail(null);
      }
    };

    fetchDetail();
  }, [contactId, open]);

  const handleClose = () => {
    setDetail(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-11/12 max-w-lg p-6 relative animate-in fade-in zoom-in duration-200">
        
        {/* Close Button */}
        <button
          className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100 transition"
          onClick={handleClose}
        >
          <X className="h-5 w-5 text-gray-500 hover:text-gray-700" />
        </button>

        {/* Header */}
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">
          {detail?.name || "Customer"}
        </h2>

        {/* Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-gray-700">
            <Mail className="h-5 w-5 text-blue-600" />
            <span>{detail?.email || "Not provided"}</span>
          </div>

          <div className="flex items-center gap-3 text-gray-700">
            <Phone className="h-5 w-5 text-green-600" />
            <span>{detail?.phoneNumber}</span>
          </div>

          <div className="flex items-center gap-3 text-gray-700">
            <Building2 className="h-5 w-5 text-purple-600" />
            <span>{detail?.company || "Independent"}</span>
          </div>

          <div className="flex items-center gap-3 text-gray-700">
            <Calendar className="h-5 w-5 text-orange-600" />
            <span>
              {detail?.schedules?.[0]?.scheduleDate
                ? new Date(detail.schedules[0].scheduleDate).toLocaleString()
                : "No schedule"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerDetailModal;
