"use client";
import { useEffect, useState } from "react";
import { Upload, Users, AlertCircle, CheckCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";

interface Lead {
  id: string;
  name: string;
  phoneNumber: string;
  status: string;
  createdAt: string;
}

interface UploadResult {
  message: string;
  inserted: number;
  invalid: number;
  errors: { row: number; reason: string }[];
}

// Define missing Assistant type
interface Assistant {
  id: string;
  name: string;
}

export default function LeadsPage() {
  const [assistantId, setAssistantId] = useState("");
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const searchParams = useSearchParams();
  const locationIdFromUrl = searchParams?.get("locationId") ?? "";
  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState<string>("");
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch leads from API
  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/lead");
      if (!res.ok) throw new Error("Failed to fetch leads");
      const data = await res.json();
      setLeads(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch assistants (no need to include it as dependency)
  const fetchAssistants = async () => {
    try {
      let qs = "?hasNumber=true";

      if (locationIdFromUrl) {
        qs += `&locationId=${encodeURIComponent(locationIdFromUrl)}`;
      }
      const res = await fetch(`/api/assistants${qs}`);
      if (!res.ok) throw new Error("Failed to fetch assistants");
      const data = await res.json();
      setAssistants(data);
      if (data.length > 1 || data.length === 0) return;
      setAssistantId(data?.[0].id);
    } catch (error: any) {
      console.error("Failed to fetch assistants:", error);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchAssistants();
  }, [locationIdFromUrl]); // refetch if location changes

  // Upload CSV to API
   const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";

    // Require assistant selection
    if (!assistantId) {
      setError("Please select an assistant before uploading.");
      return;
    }

    setError("");
    setUploadResult(null);
    setIsUploading(true);

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a CSV file only.");
      setIsUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("assistantId", assistantId);

      const res = await fetch("/api/lead", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload CSV");

      setUploadResult(data);
      await fetchLeads();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      event.target.value = ""; // ✅ always reset at the end
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
          </div>
          <p className="text-gray-600">Manage and view your lead data</p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Upload Leads
            </h2>
            <div className="text-sm text-gray-500">
              {leads.length > 0 && `${leads.length} leads in database`}
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
              disabled={isUploading}
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-5 h-5" />
              {isUploading ? "Uploading..." : "Upload CSV"}
            </label>
            <p className="mt-3 text-sm text-gray-500">
              Only CSV files with "name" and "contactNumber" columns are
              accepted
            </p>
          </div>

          {/* Generic error */}
          {error && (
            <div className="mt-4 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          )}
          {assistants.length > 1 && (
            <div className="mt-4">
              <label
                htmlFor="assistantId"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Select Assistant
              </label>
              <select
                id="assistantId"
                value={assistantId}
                onChange={(e) => setAssistantId(e.target.value)}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors
                border-gray-300 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Select an assistant</option>
                {assistants.map((assistant) => (
                  <option key={assistant.id} value={assistant.id}>
                    {assistant.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Assistant:{" "}
              <span className="font-medium">
                {assistants?.find((item) => item.id === assistantId)?.name}
              </span>
            </p>
          </div>

          {/* Upload results */}
          {uploadResult && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-gray-800">
                  {uploadResult.inserted} leads inserted successfully
                </span>
              </div>

              {uploadResult.invalid > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-red-600 mb-1">
                    {uploadResult.invalid} rows failed:
                  </p>
                  <ul className="text-sm text-red-500 list-disc pl-5 space-y-1 max-h-40 overflow-y-auto">
                    {uploadResult.errors.map((err, idx) => (
                      <li key={idx}>
                        Row {err.row}: {err.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Leads Table */}
        {leads.length > 0 && !isLoading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Leads Data
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {lead.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lead.phoneNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lead.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {leads.length === 0 && !error && !isLoading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No leads yet
            </h3>
            <p className="text-gray-500 mb-6">
              Upload a CSV file to save leads to the database and view them here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
