"use client";

import { useState } from "react";

export default function ProcessConversationButton({ callId, userId }: { callId: string; userId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleProcess = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/chat-gpt/processConversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId, userId })
      });

      const data = await response.json();
      setResult(data);
      console.log("Contact:", data.contact);
      console.log("Schedule:", data.schedule);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleProcess} disabled={loading}>
        {loading ? "Processing..." : "Process Conversation"}
      </button>

      {result && (
        <div>
          <h3>Contact Saved:</h3>
          <pre>{JSON.stringify(result.contact, null, 2)}</pre>

          <h3>Schedule Saved:</h3>
          <pre>{JSON.stringify(result.schedule, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
