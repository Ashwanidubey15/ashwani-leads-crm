import React, { useEffect, useMemo, useState } from "react";

interface CustomerDetailModal {
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

function CustomerDetailModal({
  open,
  onClose,
  contactId,
}: CustomerDetailModal) {
  const [detail, setDetail] = useState<CustomerDetail | null>(null);

  useEffect(() => {
    if (!contactId && !open) return;

    const fetchDetail = async () => {
      try {
        const response = await fetch(`/api/contacts/${contactId}`, {
          cache: "no-store",
        });
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

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#060606c9] bg-opacity-25">
          <div className="bg-white rounded-xl shadow-lg w-11/12 max-w-md p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
              onClick={handleClose}
            >
              ✖️
            </button>

            <h2 className="text-2xl font-bold mb-4">{detail?.name}</h2>
            <p className="mb-2">
              <span className="font-semibold">Email:</span>{" "}
              {detail?.email || "Not provided"}
            </p>
            <p className="mb-2">
              <span className="font-semibold">Phone:</span>{" "}
              {detail?.phoneNumber}
            </p>
            <p className="mb-2">
              <span className="font-semibold">Company:</span>{" "}
              {detail?.company || "Independent"}
            </p>
            <p>
              <span className="font-semibold">Next Schedule:</span>{" "}
              {detail?.schedules?.[0]?.scheduleDate
                ? new Date(
                    detail.schedules[0].scheduleDate
                  ).toLocaleString()
                : "No schedule"}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default CustomerDetailModal;
