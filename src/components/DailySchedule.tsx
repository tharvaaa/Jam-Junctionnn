/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from "react";
import { Booking, BookingStatus, BookingType } from "../types";
import { 
  Calendar, Search, Trash2, Check,
  Music, AlertCircle, Clock, Mic2, FileAudio, Filter,
  Sparkles, Layers
} from "lucide-react";

interface DailyScheduleProps {
  bookings: Booking[];
  onUpdateBookingStatus: (id: string, newStatus: BookingStatus) => void;
  onDeleteBooking: (id: string) => void;
  onClearAllBookings?: () => void;
}

export default function DailySchedule({ bookings, onUpdateBookingStatus, onDeleteBooking, onClearAllBookings }: DailyScheduleProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  // Today's real local ISO date string
  const todayDateStr = useMemo(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  // Calendar Filter state: default to "all" so newly locked bookings immediately appear in the timeline!
  const [selectedDate, setSelectedDate] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("All");

  // Format date helper for header view
  const formatDateFriendly = (dateStr: string) => {
    if (dateStr === "all") return "All Sessions (Full Timeline)";
    try {
      const d = new Date(dateStr + "T00:00:00");
      return d.toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Collect unique dates from actual bookings
  const bookingDates = useMemo(() => {
    const dates = new Set<string>();
    bookings.forEach(b => {
      if (b.date) dates.add(b.date);
    });
    return Array.from(dates).sort().reverse();
  }, [bookings]);

  // Filtered Bookings list
  const filteredBookings = bookings.filter((b) => {
    const matchesDate = selectedDate === "all" || b.date === selectedDate;
    const matchesSearch = 
      b.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (b.equipment && b.equipment.some(e => e.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      (b.customRequests && b.customRequests.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedTypeFilter === "All" || b.type === selectedTypeFilter;
    
    return matchesDate && matchesSearch && matchesType;
  });

  // Sort bookings: newest/upcoming sessions first
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    if (selectedDate === "all") {
      // Sort by date descending, then createdAt descending
      const dateCmp = b.date.localeCompare(a.date);
      if (dateCmp !== 0) return dateCmp;
      return (b.createdAt || "").localeCompare(a.createdAt || "");
    }
    // For single day, sort by createdAt descending or timeSlot
    return (b.createdAt || "").localeCompare(a.createdAt || "");
  });

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case "Live Now":
        return "bg-rose-500/20 border-rose-500/50 text-rose-300";
      case "Up Next":
        return "bg-amber-500/20 border-amber-500/40 text-amber-300";
      case "Completed":
        return "bg-emerald-500/20 border-emerald-500/40 text-emerald-300";
      case "Cancelled":
        return "bg-gray-500/20 border-gray-500/30 text-gray-400";
    }
  };

  const getSessionTypeIcon = (type: BookingType) => {
    switch (type) {
      case "Jam":
        return <Music className="h-4 w-4 text-purple-400" />;
      case "Karaoke":
        return <Mic2 className="h-4 w-4 text-pink-400" />;
      case "Recording":
        return <FileAudio className="h-4 w-4 text-teal-400" />;
    }
  };

  // Helper to check if a booking was created within the last 15 minutes
  const isJustLocked = (createdAt?: string) => {
    if (!createdAt) return false;
    try {
      const createdTime = new Date(createdAt).getTime();
      return Date.now() - createdTime < 15 * 60 * 1000;
    } catch {
      return false;
    }
  };

  return (
    <div className="space-y-6 relative z-10 p-1 md:p-3">
      
      {/* FILTER STICKY RAIL COMPONENT */}
      <div className="glass-panel rounded-2xl p-5 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setSelectedDate("all")}
              className={`text-xs font-bold px-4 py-2.5 rounded-xl border transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
                selectedDate === "all"
                  ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/30 scale-105"
                  : "bg-black/40 border-white/5 text-gray-400 hover:text-white hover:border-white/10"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>All Sessions Timeline ({bookings.length})</span>
            </button>

            <button
              onClick={() => setSelectedDate(todayDateStr)}
              className={`text-xs font-semibold px-3.5 py-2.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                selectedDate === todayDateStr
                  ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/30"
                  : "bg-black/40 border-white/5 text-gray-400 hover:text-white hover:border-white/10"
              }`}
            >
              Today
            </button>

            {bookingDates.slice(0, 3).map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDate(d)}
                className={`text-xs font-mono font-semibold px-3 py-2.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                  selectedDate === d
                    ? "bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-600/30"
                    : "bg-black/40 border-white/5 text-gray-400 hover:text-white hover:border-white/10"
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Date Picker & Clear All Sessions Action */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-semibold">Filter Date:</span>
              <input
                type="date"
                value={selectedDate === "all" ? "" : selectedDate}
                onChange={(e) => setSelectedDate(e.target.value || "all")}
                className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500 cursor-pointer text-xs"
              />
              {selectedDate !== "all" && (
                <button
                  onClick={() => setSelectedDate("all")}
                  className="text-[10px] text-purple-300 hover:underline uppercase font-bold"
                >
                  Reset
                </button>
              )}
            </div>

            {onClearAllBookings && (
              showClearConfirm ? (
                <div className="flex items-center gap-1.5 bg-red-950/40 border border-red-500/50 p-1 rounded-xl animate-fadeIn">
                  <span className="text-[10px] text-red-200 font-bold px-1">Clear all sessions?</span>
                  <button
                    onClick={() => {
                      onClearAllBookings();
                      setShowClearConfirm(false);
                    }}
                    className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold uppercase transition-all cursor-pointer"
                  >
                    Yes, Clear
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-1.5 py-0.5 bg-white/10 hover:bg-white/20 text-gray-300 rounded text-[10px] font-bold transition-all cursor-pointer"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  disabled={bookings.length === 0}
                  className="cursor-pointer bg-red-950/20 hover:bg-red-900/30 text-red-300 hover:text-white border border-red-500/30 px-2.5 py-2 rounded-xl font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Clear all scheduled sessions"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Clear All Sessions</span>
                </button>
              )
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 border-t border-white/5">
          {/* Search bar */}
          <div className="md:col-span-6 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by client/band name, requests, gear..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs text-white border input-interactive placeholder-gray-600 focus:outline-none pointer-events-auto"
            />
          </div>

          {/* Type Filter Tabs */}
          <div className="md:col-span-4 flex items-center bg-black/40 p-1 rounded-xl border border-white/5">
            {["All", "Jam", "Karaoke", "Recording"].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedTypeFilter(type)}
                className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-all duration-300 cursor-pointer ${
                  selectedTypeFilter === type
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="md:col-span-2 flex items-center justify-end gap-1.5 text-[11px] font-mono text-gray-400 bg-black/20 px-3 py-2 rounded-xl border border-white/5">
            <Filter className="h-3.5 w-3.5 text-purple-400" />
            <span>Showing: <strong className="text-purple-300 font-bold">{sortedBookings.length}</strong></span>
          </div>
        </div>
      </div>

      {/* TIMELINE LIST */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-purple-500 rounded-full animate-ping" />
            <h3 className="text-sm font-bold tracking-wider uppercase text-gray-300 font-sans">
              Live Timeline — {formatDateFriendly(selectedDate)}
            </h3>
          </div>
        </div>

        {sortedBookings.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center pointer-events-auto">
            <AlertCircle className="h-10 w-10 text-purple-400/60 mx-auto mb-3" />
            <p className="text-sm text-gray-300 font-bold">No sessions found for this filter</p>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              Click <strong className="text-purple-400 cursor-pointer" onClick={() => setSelectedDate("all")}>"All Sessions Timeline"</strong> above to see all locked sessions, or log a new booking from the Command Center tab.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedBookings.map((booking) => {
              const justLocked = isJustLocked(booking.createdAt);

              return (
                <div
                  key={booking.id}
                  id={`booking-card-${booking.id}`}
                  className={`glass-panel rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border pointer-events-auto transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-500/15 ${
                    justLocked ? "border-purple-500/60 bg-purple-950/20 shadow-lg shadow-purple-500/10" : "border-white/5"
                  }`}
                >
                  {/* Main Session Identity info */}
                  <div className="space-y-3 flex-1">
                    
                    {/* Top Tag Badges Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      {justLocked && (
                        <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md shadow-pink-500/20 animate-pulse">
                          <Sparkles className="h-3 w-3" /> Just Locked
                        </span>
                      )}

                      <div className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 flex items-center gap-1.5">
                        {getSessionTypeIcon(booking.type)}
                        <span className="text-xs font-semibold text-white uppercase tracking-wider">{booking.type}</span>
                      </div>

                      <span className="text-xs font-mono font-bold text-gray-300 flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-md border border-white/5">
                        <Calendar className="h-3.5 w-3.5 text-purple-400" />
                        <span>{booking.date}</span>
                      </span>

                      <span className="text-xs font-mono font-bold text-purple-300 flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-md border border-purple-500/20">
                        <Clock className="h-3.5 w-3.5 text-purple-400" />
                        <span>{booking.hours} hrs</span>
                        {booking.timeSlot && !booking.timeSlot.includes("Session") && (
                          <span className="text-[10px] text-gray-400">({booking.timeSlot})</span>
                        )}
                      </span>

                      <span className={`text-[10px] uppercase tracking-widest font-bold py-0.5 px-2.5 border rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>

                    {/* PROMINENT CLIENT / BAND NAME */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-[10px] uppercase tracking-widest font-mono font-black px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          BAND / CLIENT
                        </span>
                        <h4 className="text-xl md:text-2xl font-black text-white tracking-tight">
                          {booking.clientName}
                        </h4>
                      </div>

                      {booking.customRequests && (
                        <p className="text-xs text-gray-400 font-serif italic mt-1 bg-black/30 p-2.5 rounded-xl border border-white/5">
                          <strong className="text-purple-300 font-sans text-[10px] uppercase tracking-widest not-italic block mb-0.5">Special Requests</strong>
                          "{booking.customRequests}"
                        </p>
                      )}
                    </div>

                    {/* Configured Equipment list */}
                    {booking.equipment && booking.equipment.length > 0 && (
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Assigned Gear & Setup</span>
                        <div className="flex flex-wrap gap-1.5">
                          {booking.equipment.map((eq) => (
                            <span
                              key={eq}
                              className="bg-purple-950/10 border border-purple-500/20 text-purple-300/90 text-[10px] px-2 py-0.5 rounded"
                            >
                              {eq}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Price Summary, Status Toggle, and Delete Action Row */}
                  <div className="w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-white/5 flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4">
                    
                    <div className="text-left md:text-right">
                      <span className="text-[10px] uppercase tracking-wider text-gray-500 block">Payout Value</span>
                      <span className="text-2xl font-black font-mono text-white block">
                        ₹{booking.totalAmount.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono block">
                        (₹{booking.finalRate}/hr x {booking.hours} hrs)
                      </span>
                    </div>

                    {/* Status update selector & Trash */}
                    <div className="flex items-center gap-2">
                      
                      {/* Live update status toggler */}
                      <div className="flex items-center gap-1">
                        {booking.status !== "Completed" && booking.status !== "Cancelled" && (
                          <button
                            title="Advance Status"
                            onClick={() => {
                              const next = booking.status === "Up Next" ? "Live Now" : "Completed";
                              onUpdateBookingStatus(booking.id, next);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-600 hover:text-white border border-purple-500/30 text-[11px] font-bold text-purple-300 transition duration-300 cursor-pointer"
                          >
                            {booking.status === "Up Next" ? "Go Live 🟢" : "Complete ✓"}
                          </button>
                        )}

                        {booking.status === "Completed" && (
                          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/20 border border-emerald-500/30 px-2.5 py-1.5 rounded-lg flex items-center gap-1 select-none">
                            <Check className="h-3 w-3" /> Fully Settled
                          </span>
                        )}

                        {booking.status === "Cancelled" && (
                          <span className="text-[11px] text-gray-500 bg-gray-900 border border-gray-800 px-2 py-1 rounded select-none">
                            Cancelled
                          </span>
                        )}
                      </div>

                      <button
                        title="Remove session"
                        onClick={() => {
                          if (confirm(`Are you absolutely sure you want to remove ${booking.clientName} from the logs?`)) {
                            onDeleteBooking(booking.id);
                          }
                        }}
                        className="p-2 rounded-xl bg-red-950/20 border border-red-500/10 hover:border-red-500/50 text-red-400 hover:bg-red-950/40 hover:text-red-300 transition duration-300 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
