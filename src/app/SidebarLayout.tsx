"use client";
import { SessionProvider, useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function SidebarContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname() || "";
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [locations, setLocations] = useState<{ id: string; address: string }[]>(
    []
  );
  const [selectedLocation, setSelectedLocation] = useState("");
  // Hide sidebar on landing, login, and signup pages
  const hideSidebar = ["/", "/login", "/signup"].includes(pathname);
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch("/api/locations");
        if (!res.ok) throw new Error("Failed to fetch locations");
        const data = await res.json();

        // Ensure it's stored as an array
        const list = data.data || [];
        setLocations(list);
        if (list.length > 0 && !selectedLocation) {
          setSelectedLocation(list[0].id);
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };

    fetchLocations();

    const onCreated = (e: Event) => {
      const detail = (e as CustomEvent<{ id: string; address: string }>).detail;
      if (!detail) return;
      // Prepend new location and select it
      setLocations((prev) => [detail, ...prev]);
      setSelectedLocation(detail.id);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("location:created", onCreated as EventListener);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(
          "location:created",
          onCreated as EventListener
        );
      }
    };
  }, []);

  if (status === "loading") return null;
  if (!session || hideSidebar) return <>{children}</>;

  const isActive = (path: string) => pathname === path;
  const onLocationsPath = pathname.startsWith("/locations");

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={`sticky top-0 h-screen overflow-y-auto bg-gradient-to-b from-purple-900 via-purple-800 to-purple-900 border-r border-purple-700 flex flex-col justify-between py-8 shadow-2xl transition-all duration-300 ${
          isCollapsed ? "w-24 px-4" : "w-72 px-6"
        }`}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute top-8 -right-3 transform -translate-y-1/2 bg-white p-1 rounded-full shadow-lg border border-gray-200 hover:bg-gray-100 transition-all z-10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d={isCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
            />
          </svg>
        </button>
        <div>
          {/* Logo/Brand */}
          <div className="mb-10">
            <div
              className={`flex items-center gap-3 mb-2 ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              {!isCollapsed && (
                <div>
                  <div className="text-xl font-bold text-white">TrueLeads</div>
                  <div className="text-xs text-purple-200 font-medium">
                    CRM Platform
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-1">
            <div
              className={`py-3 px-4 rounded-xl font-medium flex items-center gap-3 transition-all duration-200 ${
                onLocationsPath
                  ? "bg-white text-purple-900 shadow-lg transform scale-105"
                  : "text-purple-100 hover:bg-purple-700 hover:text-white"
              } ${isCollapsed ? "justify-center" : ""}`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  onLocationsPath ? "bg-purple-100" : "bg-purple-700"
                }`}
              >
                <svg
                  className="w-6 h-6 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <title>Location</title>
                  <path d="M12 21s-6.5-6.75-6.5-11A6.5 6.5 0 0112 3a6.5 6.5 0 016.5 6c0 4.25-6.5 11-6.5 11z" />
                  <circle cx="12" cy="9" r="2.25" fill="currentColor" />
                </svg>
              </div>
              {!isCollapsed && (
                <div className="ml-auto w-full relative">
                  <div className="relative">
                    {/* Location icon on the left */}
                    <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
                      <svg
                        className="w-5 h-5 text-purple-700"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM12 11a2 2 0 100-4 2 2 0 000 4z" />
                      </svg>
                    </div>

                    {/* Select dropdown */}
                    <select
                      className="w-full appearance-none bg-white text-purple-900 border border-purple-700 rounded-xl py-2 pl-9 pr-8 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                      value={selectedLocation}
                      onChange={(e) => {
                        const newId = e.target.value;
                        setSelectedLocation(newId);
                        if (newId) {
                          router.push(`/assistants?locationId=${newId}`);
                        }
                      }}
                    >
                 
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.address}
                        </option>
                      ))}
                    </select>

                    {/* Chevron (dropdown arrow) on the right */}
                    <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                      <svg
                        className="w-4 h-4 text-purple-700"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* The rest of the static nav items */}
            <Link
              href="/dashboard"
              className={`py-3 px-4 rounded-xl font-medium flex items-center gap-3 transition-all duration-200 ${
                isActive("/dashboard")
                  ? "bg-white text-purple-900 shadow-lg transform scale-105"
                  : "text-purple-100 hover:bg-purple-700 hover:text-white"
              } ${isCollapsed ? "justify-center" : ""}`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isActive("/dashboard") ? "bg-purple-100" : "bg-purple-700"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </div>
              {!isCollapsed && <span>Dashboard</span>}
            </Link>
            <Link
              href={`/inbox?locationId=${selectedLocation}`}
              className={`py-3 px-4 rounded-xl font-medium flex items-center gap-3 transition-all duration-200 ${
                isActive("/inbox")
                  ? "bg-white text-purple-900 shadow-lg transform scale-105"
                  : "text-purple-100 hover:bg-purple-700 hover:text-white"
              } ${isCollapsed ? "justify-center" : ""}`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isActive("/inbox") ? "bg-purple-100" : "bg-purple-700"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              {!isCollapsed && <span>Inbox</span>}
            </Link>

            <Link
              href={`/assistants?locationId=${selectedLocation}`}
              className={`py-3 px-4 rounded-xl font-medium flex items-center gap-3 transition-all duration-200 ${
                isActive("/assistants")
                  ? "bg-white text-purple-900 shadow-lg transform scale-105"
                  : "text-purple-100 hover:bg-purple-700 hover:text-white"
              } ${isCollapsed ? "justify-center" : ""}`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isActive("/assistants") ? "bg-purple-100" : "bg-purple-700"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              {!isCollapsed && <span>Assistants</span>}
            </Link>

            <Link
              href={`/phone-numbers?locationId=${selectedLocation}`}
              className={`py-3 px-4 rounded-xl font-medium flex items-center gap-3 transition-all duration-200 ${
                isActive("/phone-numbers")
                  ? "bg-white text-purple-900 shadow-lg transform scale-105"
                  : "text-purple-100 hover:bg-purple-700 hover:text-white"
              } ${isCollapsed ? "justify-center" : ""}`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isActive("/phone-numbers") ? "bg-purple-100" : "bg-purple-700"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              {!isCollapsed && <span>Phone Numbers</span>}
            </Link>

            <Link
              href={`/addresses?locationId=${selectedLocation}`}
              className={`py-3 px-4 rounded-xl font-medium flex items-center gap-3 transition-all duration-200 ${
                isActive("/addresses")
                  ? "bg-white text-purple-900 shadow-lg transform scale-105"
                  : "text-purple-100 hover:bg-purple-700 hover:text-white"
              } ${isCollapsed ? "justify-center" : ""}`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isActive("/addresses") ? "bg-purple-100" : "bg-purple-700"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7h18M5 11h14M7 15h10M9 19h6"
                  />
                </svg>
              </div>
              {!isCollapsed && <span>Addresses</span>}
            </Link>
          </nav>
        </div>

        {/* User Profile Section */}
        <div className="border-t border-purple-700 pt-6">
          <div
            className={`flex items-center gap-3 mb-4 ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-white font-bold text-lg">
                {session?.user?.name?.charAt(0) ||
                  session?.user?.email?.charAt(0) ||
                  "U"}
              </span>
            </div>
            {!isCollapsed && (
              <div className="flex-1">
                <div className="text-white font-medium text-sm">
                  {session?.user?.name || "User"}
                </div>
                <div className="text-purple-200 text-xs">
                  {session?.user?.email}
                </div>
              </div>
            )}
          </div>

          <button
            className={`w-full py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2 ${
              isCollapsed ? "aspect-square" : ""
            }`}
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
      <main className="flex-1 bg-gray-50 overflow-y-auto h-screen">{children}</main>
    </div>
  );
}

export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <SidebarContent>{children}</SidebarContent>
    </SessionProvider>
  );
}
