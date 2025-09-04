"use client";

import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import CustomerDetailModal from "@/components/CustomerDetailModal";

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color?: string;
  contactId?: string;
};

type ApiContact = {
  id: string;
  name: string;
  company: string | null;
  schedules: { id: string; scheduleDate: string | null }[];
};

export default function SchedulePage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [visibleEvents, setVisibleEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentRange, setCurrentRange] = useState<{ start: Date; end: Date } | null>(null);
  const [showDetail, setShowDetails] = useState({
    open: false,
    contactId: "",
  });

  // Fetch API schedules and map to events
  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/contacts", { cache: "no-store" });
        const contacts: ApiContact[] = await res.json();
        if (!ignore) {
          const mapped = contacts.flatMap((c) =>
            c.schedules
              .filter((s) => !!s.scheduleDate)
              .map((s) => {
                const start = new Date(s.scheduleDate!);
                const end = new Date(start.getTime() + 60 * 60 * 1000);

                return {
                  id: s.id,
                  title: `${c.name}${c.company ? ` · ${c.company}` : ""}`,
                  start,
                  end,
                  color: "bg-purple-600", // ✅ fixed color
                  contactId: c.id,
                };
              })
          );
          setEvents(mapped);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  // Handle visible events count when month/week/day changes
  const handleDatesSet = (arg: any) => {
    setCurrentRange({ start: arg.start, end: arg.end });
  };

  useEffect(() => {
    if (!currentRange) return;
    const filtered = events.filter(
      (e) => e.start >= currentRange.start && e.start < currentRange.end
    );
    setVisibleEvents(filtered);
  }, [events, currentRange]);

  const handleEventClick = (info: any) => {
    const event = info.event;
    if (event.extendedProps.contactId) {
      setShowDetails({
        open: true,
        contactId: event.extendedProps.contactId,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
              <p className="text-gray-600 mt-1">
                Manage your appointments and meetings
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium shadow-lg">
                {visibleEvents.length} Events
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading && (
          <div className="mb-6 flex items-center justify-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200/50">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-700 font-medium">
                  Loading schedules...
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-6">
          {/* Calendar */}
          <div className="w-full transition-all duration-500 ease-in-out">
            <div className=" text-black backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,timeGridWeek,timeGridDay",
                }}
                events={events}
                datesSet={handleDatesSet}
                eventContent={({ event }) => (
                  <div
                    className="bg-purple-600 text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer border border-white/20"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-white/80 rounded-full animate-pulse"></div>
                      <span className="font-semibold text-sm truncate">
                        {event.title}
                      </span>
                    </div>
                    <div className="text-xs text-white/90 space-y-1">
                      <div className="flex items-center gap-1">
                        <span>📅</span>
                        <span>{event.start?.toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>🕐</span>
                        <span>
                          {event.start?.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          -{" "}
                          {event.end?.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                selectable
                eventClick={handleEventClick}
                height="80vh"
              />
            </div>
          </div>

          <CustomerDetailModal
            open={showDetail.open}
            contactId={showDetail.contactId}
            onClose={() =>
              setShowDetails({
                open: false,
                contactId: "",
              })
            }
          />
        </div>
      </div>
    </div>
  );
}
