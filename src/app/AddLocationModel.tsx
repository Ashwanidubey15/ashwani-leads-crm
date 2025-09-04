import { useState } from "react";

export default function AddLocationModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated?: (loc: { id: string; address: string }) => void;
}) {
  const [address, setAddress] = useState("");

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    const res = await fetch("/api/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    if (res.ok) {
      const data = await res.json();
      onCreated?.(data.data);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("location:created", { detail: data.data })
        );
      }
    }
    setAddress("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#060606c9] bg-opacity-25">
      <div className="bg-white rounded-xl shadow-lg max-w-lg w-full p-6 relative">
        {/* Close button */}
        <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-black">
          Add Location
        </h2>

        <button
          onClick={() => onClose()}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-lg font-bold"
        >
          &times;
        </button>

        {/* Summary Content */}
        <form onSubmit={handleSubmit}>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter address"
            className="border border-gray-300 rounded w-full px-3 py-2 mb-4"
          />
          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded w-full"
          >
            Save Location
          </button>
        </form>
      </div>
    </div>
  );
}
