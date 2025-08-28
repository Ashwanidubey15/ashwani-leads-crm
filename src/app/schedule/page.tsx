"use client";

import { useEffect, useMemo, useState } from "react";

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color?: string;
};

type ApiContact = {
  id: string;
  name: string;
  company: string | null;
  schedules: { id: string; scheduleDate: string | null }[];
};

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // make Monday first
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
  });
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

type ViewMode = "week" | "day";

export default function SchedulePage() {
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<ViewMode>("week");
  const [loadedEvents, setLoadedEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load schedules from API and map to events
  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/contacts", { cache: "no-store" });
        if (!res.ok)
          throw new Error(`Failed to fetch contacts (${res.status})`);
        const contacts: ApiContact[] = await res.json();
        const events: CalendarEvent[] = [];
        for (const c of contacts) {
          for (const s of c.schedules) {
            if (!s.scheduleDate) continue;
            const start = new Date(s.scheduleDate);
            const end = new Date(start.getTime() + 60 * 60 * 1000);
            events.push({
              id: s.id,
              title: `${c.name || "Unknown"}${
                c.company ? ` · ${c.company}` : ""
              }`,
              start,
              end,
              color: "#2563eb",
            });
          }
        }
        if (!ignore) setLoadedEvents(events);
      } catch (e: any) {
        if (!ignore) setError(e?.message || "Failed to load schedules");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const weekStart = startOfWeek(referenceDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const eventsByDay = useMemo(() => {
    const group = (date: Date) => {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      return loadedEvents.filter(
        (e) => e.start >= startOfDay && e.start <= endOfDay
      );
    };
    return weekDays.map((d) => group(d));
  }, [weekDays, loadedEvents]);

  const selectedDayEvents = useMemo(() => {
    const s = new Date(selectedDate);
    s.setHours(0, 0, 0, 0);
    const e = new Date(selectedDate);
    e.setHours(23, 59, 59, 999);
    return loadedEvents.filter((ev) => ev.start >= s && ev.start <= e);
  }, [selectedDate, loadedEvents]);

  // Mini month calendar data
  const [miniMonthRef, setMiniMonthRef] = useState<Date>(new Date());
  const miniStart = startOfMonth(miniMonthRef);
  const miniEnd = endOfMonth(miniMonthRef);
  const miniWeeksStart = startOfWeek(miniStart);
  const miniTotalDays =
    Math.ceil(((miniEnd.getDay() || 7) + miniEnd.getDate()) / 7) * 7; // full weeks grid
  const miniDays = Array.from({ length: miniTotalDays }, (_, i) =>
    addDays(miniWeeksStart, i)
  );

  const hasEventOnDay = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const ev of loadedEvents) {
      const key = new Date(
        ev.start.getFullYear(),
        ev.start.getMonth(),
        ev.start.getDate()
      ).toISOString();
      map.set(key, true);
    }
    return (date: Date) =>
      map.has(
        new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        ).toISOString()
      );
  }, [loadedEvents]);

  // No auto-sync effect here. We update miniMonthRef explicitly in navigation handlers

  const renderGrid = (days: Date[], eventsGrouped: CalendarEvent[][]) => (
    <div className="flex-1 grid grid-cols-8 border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Left hour gutter */}
      <div className="bg-gray-50 border-r border-gray-200">
        <div className="h-12 border-b" />
        {HOURS.map((h) => (
          <div
            key={h}
            className="h-16 border-b border-gray-200 text-xs text-gray-500 px-2 flex items-start"
          >
            {h === 0
              ? ""
              : new Date(0, 0, 0, h).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
          </div>
        ))}
      </div>

      {/* Days columns */}
      {days.map((day, dayIndex) => {
        const isToday = new Date().toDateString() === day.toDateString();
        return (
          <div
            key={dayIndex}
            className="relative border-r last:border-r-0 border-gray-200"
          >
            {/* Day header */}
            <div
              className={`h-12 px-3 flex items-center justify-between border-b ${
                isToday ? "bg-blue-50" : "bg-white"
              }`}
            >
              <div className="text-sm font-medium">{formatDateLabel(day)}</div>
              {isToday && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600 text-white">
                  Today
                </span>
              )}
            </div>

            {/* Hour rows */}
            {HOURS.map((h) => (
              <div key={h} className="h-16 border-b border-gray-100" />
            ))}

            {/* Events */}
            <div className="absolute inset-x-0 top-12 bottom-0">
              {eventsGrouped[dayIndex].map((evt) => {
                const minutesFromTop =
                  evt.start.getHours() * 60 + evt.start.getMinutes();
                const minutesDuration =
                  (evt.end.getTime() - evt.start.getTime()) / 60000;
                const top = (minutesFromTop / (24 * 60)) * 24 * 64; // 24 rows * 64px per hour
                const height = Math.max(24, (minutesDuration / 60) * 64);
                return (
                  <div
                    key={evt.id}
                    className="absolute left-1 right-1 rounded-md shadow-sm text-xs p-2 text-white"
                    style={{ top, height, background: evt.color || "#6b7280" }}
                  >
                    <div className="font-semibold truncate">{evt.title}</div>
                    <div className="opacity-80 truncate">
                      {evt.start.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {evt.end.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderDayGrid = () => renderGrid([selectedDate], [selectedDayEvents]);
  const renderWeekGrid = () => renderGrid(weekDays, eventsByDay);

  return (
    <div className="p-4 h-full flex flex-col">
      {/* Header controls */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => {
            if (view === "week") setReferenceDate(addDays(referenceDate, -7));
            else setSelectedDate(addDays(selectedDate, -1));
            const active =
              view === "week"
                ? addDays(referenceDate, -7)
                : addDays(selectedDate, -1);
            setMiniMonthRef(active);
          }}
          className="px-3 py-2 rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50"
        >
          ◀ Prev
        </button>
        <button
          onClick={() => {
            setReferenceDate(new Date());
            setSelectedDate(new Date());
            setMiniMonthRef(new Date());
          }}
          className="px-3 py-2 rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50"
        >
          Today
        </button>
        <button
          onClick={() => {
            if (view === "week") setReferenceDate(addDays(referenceDate, 7));
            else setSelectedDate(addDays(selectedDate, 1));
            const active =
              view === "week"
                ? addDays(referenceDate, 7)
                : addDays(selectedDate, 1);
            setMiniMonthRef(active);
          }}
          className="px-3 py-2 rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50"
        >
          Next ▶
        </button>

        <div className="ml-4 text-lg font-semibold">
          {(view === "week" ? referenceDate : selectedDate).toLocaleDateString(
            undefined,
            { month: "long", year: "numeric" }
          )}
        </div>

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setView("day")}
            className={`px-3 py-2 rounded-lg border ${
              view === "day"
                ? "bg-purple-600 text-white border-purple-600"
                : "bg-white border-gray-200"
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setView("week")}
            className={`px-3 py-2 rounded-lg border ${
              view === "week"
                ? "bg-purple-600 text-white border-purple-600"
                : "bg-white border-gray-200"
            }`}
          >
            Week
          </button>
        </div>
      </div>

      {loading && (
        <div className="mb-2 text-sm text-gray-500">Loading schedules…</div>
      )}
      {error && <div className="mb-2 text-sm text-red-600">{error}</div>}

      <div className="flex gap-4 h-[calc(100vh-170px)]">
        {/* Mini month calendar */}
        <div className="w-72 bg-white border border-gray-200 rounded-lg p-3 h-full">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setMiniMonthRef(addMonths(miniMonthRef, -1))}
              className="px-2 py-1 text-sm rounded hover:bg-gray-100"
            >
              ◀
            </button>
            <div className="text-sm font-semibold">
              {miniMonthRef.toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
              })}
            </div>
            <button
              onClick={() => setMiniMonthRef(addMonths(miniMonthRef, 1))}
              className="px-2 py-1 text-sm rounded hover:bg-gray-100"
            >
              ▶
            </button>
          </div>

          <div className="flex justify-between text-[11px] text-gray-500 mb-1">
            {"SMTWTFS".split("").map((d, idx) => (
              <div key={`${d}-${idx}`} className="flex-1 text-center py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {miniDays.map((d, idx) => {
              const inMonth = d.getMonth() === miniMonthRef.getMonth();
              const isSel = sameDay(d, selectedDate);
              const isToday = sameDay(d, new Date());
              const dot = hasEventOnDay(d);
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedDate(d);
                    setReferenceDate(d);
                    setView("day");
                  }}
                  className={`h-8 rounded-md text-xs flex flex-col items-center justify-center border ${
                    isSel
                      ? "bg-purple-600 text-white border-purple-600"
                      : isToday
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  } ${inMonth ? "" : "opacity-40"}`}
                >
                  <span>{d.getDate()}</span>
                  {dot && (
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-3">
            <button className="w-full flex items-center justify-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md py-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-gray-300">
                👤
              </span>
              Search for people
            </button>
          </div>
        </div>

        {/* Main grid */}
        <div className="flex-1 min-w-0">
          {view === "week" ? renderWeekGrid() : renderDayGrid()}
        </div>
      </div>
    </div>
  );
}
