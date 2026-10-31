/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Booking, BookingStatus, BookingType } from "../types";
import { TIME_SLOTS } from "../data";
import { 
  Calendar, Search, SlidersHorizontal, Trash2, CheckCircle2, 
  RotateCcw, Disc, Music, AlertCircle, Clock, Check, Mic2, FileAudio, Filter
} from "lucide-react";

interface DailyScheduleProps {
  bookings: Booking[];
  onUpdateBookingStatus: (id: string, newStatus: BookingStatus) => void;
  onDeleteBooking: (id: string) => void;
}

export default function DailySchedule({ bookings, onUpdateBookingStatus, onDeleteBooking }: DailyScheduleProps) {
  // Calendar Filter state (default: 2026-05-26 today)
  const [selectedDate, setSelectedDate] = useState("2026-05-26");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("All");

  // Format date helper for header view
  const formatDateFriendly = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Quick preset dates
  const presetDates = [
    { label: "Yesterday", date: "2026-05-25" },
    { label: "Today (May 26)", date: "2026-05-26" },
    { label: "Tomorrow", date: "2026-05-27" }
  ];

  // Filtered Bookings list
  const filteredBookings = bookings.filter((b) => {
    const matchesDate = b.date === selectedDate;
    const matchesSearch = b.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.equipment.some(e => e.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          b.customRequests.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedTypeFilter === "All" || b.type === selectedTypeFilter;
    
    return matchesDate && matchesSearch && matchesType;
  });

  // Sort bookings based on starting time
  const sortedBookings = [...filteredBookings].sort((a,b) => {
    return a.timeSlot.localeCompare(b.timeSlot);
  });

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case "Live Now":
        return "bg-rose-500/10 border-rose-500/40 text-rose-400";
      case "Up Next":
        return "bg-amber-500/10 border-amber-500/30 text-amber-300";
      case "Completed":
        return "bg-emerald-500/10 border-emerald-500/30 text-emerald-300";
      case "Cancelled":
        return "bg-gray-500/10 border-gray-500/20 text-gray-400";
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

  return (
    <div className="space-y-6 relative z-10 p-1 md:p-3">
      
      {/* FILTER STICKY RAIL COMPONENT */}
      <div className="glass-panel rounded-2xl p-5 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {presetDates.map((p) => (
              <button
                key={p.date}
                id={`preset-${p.date}`}
                onClick={() => setSelectedDate(p.date)}
                className={`flex-1 md:flex-none text-xs font-semibold px-4 py-2.5 rounded-lg border transition-all duration-300 pointer-events-auto ${
                  selectedDate === p.date
                    ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/20"
                    : "bg-black/40 border-white/5 text-gray-400 hover:text-white hover:border-white/10"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto font-mono text-xs">
            <span className="text-gray-500">Pick Day:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-black/50 border border-white/10 rounded px-3 py-1.5 text-white focus:outline-none focus:border-purple-500 pointer-events-auto cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 border-t border-white/5">
          {/* Search bar */}
          <div className="md:col-span-6 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by band, requests, equipment configuration..."
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
                    ? "bg-white/10 text-white border border-white/5"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="md:col-span-2 flex items-center justify-end gap-1.5 text-[11px] font-mono text-gray-400 bg-black/20 px-3 py-2 rounded-xl border border-white/5">
            <Filter className="h-3.5 w-3.5 text-purple-400" />
            <span>Active: <strong className="text-purple-300 font-bold">{sortedBookings.length}</strong> Bookings</span>
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
            <p className="text-sm text-gray-300 font-bold">No sessions locked for this day</p>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              Utilize the <strong className="text-purple-400">Command Center</strong> tab to register client sessions or click on "Today" to look at seeds.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedBookings.map((booking) => (
              <div
                key={booking.id}
                id={`booking-card-${booking.id}`}
                className="glass-panel premium-interactive rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border border-white/5 pointer-events-auto"
                style={{ contentVisibility: "auto" }}
              >
                {/* Main Session Identity info */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 flex items-center gap-1.5">
                      {getSessionTypeIcon(booking.type)}
                      <span className="text-xs font-semibold text-white uppercase tracking-wider">{booking.type}</span>
                    </div>

                    <span className="text-xs font-mono font-bold text-gray-400 flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded border border-white/5">
                      <Clock className="h-3 w-3 text-purple-400" />
                      {booking.timeSlot}
                    </span>

                    <span className={`text-[10px] uppercase tracking-widest font-bold py-0.5 px-2 border rounded-full ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-lg font-extrabold text-[#F5F5F7] tracking-tight">{booking.clientName}</h4>
                    {booking.customRequests && (
                      <p className="text-xs text-gray-400 font-serif italic mt-1 bg-black/30 p-2 rounded-lg border border-white/5">
                        <strong className="text-purple-300 font-sans text-[10px] uppercase tracking-widest not-italic block mb-0.5">Special Requests</strong>
                        "{booking.customRequests}"
                      </p>
                    )}
                  </div>

                  {/* Configured Equipment list */}
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Assigned Gear & Setup</span>
                    <div className="flex flex-wrap gap-1.5">
                      {booking.equipment.length > 0 ? (
                        booking.equipment.map((eq) => (
                          <span
                            key={eq}
                            className="bg-purple-950/10 border border-purple-500/20 text-purple-300/90 text-[10px] px-2 py-0.5 rounded"
                          >
                            {eq}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-gray-600 font-serif italic">No auxiliary equipment packages requested</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Price Summary, Status Toggle, and Delete Action Row */}
                <div className="w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-white/5 flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4">
                  
                  <div className="text-left md:text-right">
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 block">Payout Value</span>
                    <span className="text-xl font-bold font-mono text-white block">
                      ₹{booking.totalAmount}
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
                          className="px-2.5 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-600 hover:text-white border border-purple-500/30 text-[11px] font-bold text-purple-300 transition duration-300 cursor-pointer"
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
                      className="p-2 rounded-lg bg-red-950/20 border border-red-500/10 hover:border-red-500/50 text-red-400 hover:bg-red-950/40 hover:text-red-300 transition duration-300 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
