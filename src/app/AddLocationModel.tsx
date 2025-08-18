import { useState } from "react";

export default function AddLocationModal({ onClose }: { onClose: () => void })  {
  const [address, setAddress] = useState("");

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    await fetch("/api/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    setAddress("");
    onClose(); 
  };

  return (
    
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#060606c9] bg-opacity-25">
      <div className="bg-white rounded-xl shadow-lg max-w-lg w-full p-6 relative">
        {/* Close button */}
         <h2 className="text-lg font-bold mb-4">Add Location</h2>
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