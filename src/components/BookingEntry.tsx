/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from "react";
import { Booking, BookingType, EmailLog } from "../types";
import { 
  Plus, Music, Calendar, DollarSign, 
  Check, Mic2, FileAudio, Minus, Zap, ArrowRight, Clock
} from "lucide-react";

interface BookingEntryProps {
  onAddBooking: (booking: Booking) => void;
  onSendEmailLog: (log: EmailLog) => void;
  userEmail: string;
  onNavigateTab?: (tab: "entry" | "schedule" | "revenue" | "timeline" | "notes") => void;
}

export default function BookingEntry({ onAddBooking, onSendEmailLog, userEmail, onNavigateTab }: BookingEntryProps) {
  // Booking Form State
  const [clientName, setClientName] = useState("");
  const [date, setDate] = useState(() => {
    // Default to today's local ISO date
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  
  // Duration state (moved right after date): supports half-hour increments or any custom decimal hours
  const [hours, setHours] = useState<number>(2);
  const [sessionType, setSessionType] = useState<BookingType>("Jam");
  const [customRecordingRate, setCustomRecordingRate] = useState(600); // Studio base for recording
  const [customRequests, setCustomRequests] = useState("");

  // Submission feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [lastLoggedBooking, setLastLoggedBooking] = useState<{ id: string; name: string; amount: number; hours: number; date: string } | null>(null);

  // Auto rate computation based on session type
  const getBaseRate = (): number => {
    if (sessionType === "Jam") return 350;
    if (sessionType === "Karaoke") return 400;
    return customRecordingRate;
  };

  const finalRate = getBaseRate();
  const totalAmount = Math.round(finalRate * hours);

  // Half-hour preset suggestions
  const durationPresets = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 5.0, 6.0];

  const handleStepDuration = (delta: number) => {
    setHours((prev) => {
      const next = Math.round((prev + delta) * 2) / 2;
      return Math.max(0.5, Math.min(24, next));
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const trimmedName = clientName.trim();
      const bookingId = "b_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);
      
      const newBooking: Booking = {
        id: bookingId,
        clientName: trimmedName,
        date,
        timeSlot: `${hours}h Session`, // flexible duration-based slot
        type: sessionType,
        defaultRate: getBaseRate(),
        overrideRate: null,
        finalRate,
        hours,
        totalAmount,
        status: "Up Next",
        equipment: [],
        customRequests: customRequests.trim(),
        reminderSent: true,
        createdAt: new Date().toISOString()
      };

      onAddBooking(newBooking);

      // Trigger automatic Gmail confirmation receipt to client and dispatch alert to userEmail
      const clientEmail = `${trimmedName.replace(/\s+/g, "").toLowerCase()}@gmail.com`;
      const confirmationLog: EmailLog = {
        id: "email_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8),
        recipient: clientEmail,
        clientName: trimmedName,
        subject: `🎸 ${trimmedName} — Booking Locked (${sessionType}, ${hours} hrs @ ₹${finalRate}/hr)`,
        body: `Hi ${trimmedName},\n\nYour session has been successfully reserved and locked into THE JAM JUNCTION Studio Schedule!\n\nClient / Band Name: ${trimmedName}\n📅 Date: ${date}\n⏱️ Duration: ${hours} Hour${hours !== 1 ? "s" : ""}\n🎸 Session Specifics: ${sessionType} Session (${hours} Hrs @ ₹${finalRate}/hr)\n🎧 Total Bill: ₹${totalAmount}\n📝 Special Requests: ${customRequests.trim() || "None"}\n\n[DISPATCH ALERT: Copy delivered to supervisor ${userEmail}]\n\nKeep on Rocking!`,
        type: "confirmation",
        timestamp: new Date().toISOString(),
        status: "sent",
        bookingId,
        hours,
        totalAmount
      };
      onSendEmailLog(confirmationLog);

      setIsSubmitting(false);
      setSubmitSuccess(true);
      setLastLoggedBooking({ 
        id: bookingId, 
        name: trimmedName, 
        amount: totalAmount, 
        hours,
        date 
      });

      // Reset client name and requests, keep date for rapid entry
      setClientName("");
      setCustomRequests("");

      setTimeout(() => {
        setSubmitSuccess(false);
      }, 9000);
    }, 500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative z-10 p-1 md:p-3">
      
      {/* MAIN LOG LIVE BOOKING CONSOLE */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 relative overflow-hidden transition-all duration-300">
        
        {/* Subtle ambient liquid glow */}
        <div className="absolute top-0 right-0 w-80 h-40 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-40 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Card Header */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-white/5">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center border border-purple-500/30 shadow-lg shadow-purple-500/10">
              <Plus className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Log Live Booking</span>
                <span className="text-[10px] bg-purple-500/15 border border-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full font-mono font-bold uppercase">
                  Studio Entry
                </span>
              </h2>
              <p className="text-xs text-gray-400 font-serif italic mt-0.5">
                Register soundcheck & rehearsal sessions with custom flexible duration and real-time cloud dispatch
              </p>
            </div>
          </div>

          {/* Real-time sync badge */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/20 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Cloud Sync Active</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. CLIENT / BAND NAME */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1.5 font-mono">
              Client / Band Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Iron Maidens, The Red Velvet Band, Djent Project, Aakash Quartet"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm text-white border input-interactive placeholder-gray-600 focus:outline-none"
            />
          </div>

          {/* 2. CALENDAR DATE TAB */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1.5 font-mono">
              Select Calendar Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-purple-400 pointer-events-none" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white border input-interactive cursor-pointer font-mono"
              />
            </div>
          </div>

          {/* 3. DURATION SELECTION (HOURS) - PLACED DIRECTLY AFTER DATE TAB */}
          <div className="p-4 md:p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-purple-400" />
                  <span>Duration Selection (Hours) *</span>
                </span>
                <span className="text-[11px] text-gray-400 font-serif italic block mt-0.5">
                  Pick half-hour increments or type any custom number of hours
                </span>
              </div>

              {/* Direct Stepper & Numeric Input */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleStepDuration(-0.5)}
                  disabled={hours <= 0.5}
                  className="h-9 w-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Decrease 0.5 hour"
                >
                  <Minus className="h-4 w-4" />
                </button>

                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    value={hours}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val > 0) {
                        setHours(Math.min(24, val));
                      }
                    }}
                    className="w-24 text-center py-1.5 px-2 bg-black/60 border border-purple-500/40 rounded-xl text-sm font-mono font-bold text-white focus:outline-none focus:border-purple-400"
                  />
                  <span className="absolute right-2 top-2 text-[10px] font-mono text-gray-400 pointer-events-none">hrs</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleStepDuration(0.5)}
                  disabled={hours >= 24}
                  className="h-9 w-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Increase 0.5 hour"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Quick Half-Hour Chips */}
            <div>
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-mono block mb-2">
                Quick Half-Hour Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {durationPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setHours(preset)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all duration-200 cursor-pointer border ${
                      hours === preset
                        ? "bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-600/30 scale-105"
                        : "bg-black/30 border-white/5 text-gray-400 hover:text-white hover:border-white/15"
                    }`}
                  >
                    {preset % 1 === 0 ? `${preset}.0h` : `${preset}h`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. SESSION MODE & BASE RATE ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1.5 font-mono">
                Session Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["Jam", "Karaoke", "Recording"] as BookingType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSessionType(type)}
                    className={`py-3 px-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer flex flex-col items-center gap-1.5 border ${
                      sessionType === type
                        ? type === "Jam"
                          ? "bg-purple-600/30 border-purple-500 text-white shadow-lg shadow-purple-600/20"
                          : type === "Karaoke"
                          ? "bg-pink-600/30 border-pink-500 text-white shadow-lg shadow-pink-600/20"
                          : "bg-teal-600/30 border-teal-500 text-white shadow-lg shadow-teal-600/20"
                        : "bg-black/30 border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                    }`}
                  >
                    {type === "Jam" && <Music className="h-4 w-4 text-purple-400" />}
                    {type === "Karaoke" && <Mic2 className="h-4 w-4 text-pink-400" />}
                    {type === "Recording" && <FileAudio className="h-4 w-4 text-teal-400" />}
                    <span>{type}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1.5 font-mono">
                {sessionType === "Recording" ? "Studio Recording Rate (₹/hr)" : "Standard Rate (₹/hr)"}
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-3.5 h-4 w-4 text-purple-400" />
                {sessionType === "Recording" ? (
                  <input
                    type="number"
                    min={100}
                    step={50}
                    value={customRecordingRate}
                    onChange={(e) => setCustomRecordingRate(Math.max(100, parseInt(e.target.value) || 0))}
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white font-mono border input-interactive"
                    placeholder="Rate per hour"
                  />
                ) : (
                  <div className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white font-mono border bg-black/40 border-white/10 flex items-center justify-between select-none">
                    <span>₹{getBaseRate()} / hour</span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">Fixed standard</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 5. SPECIAL REQUESTS */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1.5 font-mono flex justify-between items-center">
              <span>Special Requests / Gear Notes</span>
              <span className="text-[10px] text-gray-500 lowercase">(optional)</span>
            </label>
            <textarea
              placeholder="e.g. Extra mic stand, setup drum riser, key card access, vocal monitor mix..."
              value={customRequests}
              onChange={(e) => setCustomRequests(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl text-sm text-white border input-interactive placeholder-gray-600 focus:outline-none"
            />
          </div>

          {/* 6. LIVE BILL CALCULATION & SUBMISSION ACTION STRIP */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/30 via-indigo-950/20 to-black/40 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="text-left w-full sm:w-auto">
              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-mono block">
                Calculated Total Bill ({hours} hrs @ ₹{finalRate}/hr)
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-300 font-mono">
                  ₹{totalAmount.toLocaleString()}
                </span>
                <span className="text-xs text-gray-400 font-serif italic">
                  {sessionType} Session
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto cursor-pointer bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:opacity-95 text-white text-xs font-bold uppercase tracking-widest px-8 py-3.5 rounded-xl shadow-xl shadow-purple-600/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Broadcasting to Cloud & Timeline...</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  <span>Lock Live Booking & Dispatch</span>
                </>
              )}
            </button>
          </div>

        </form>

        {/* SUCCESS CONFIRMATION BANNER WITH DIRECT TIMELINE JUMP BUTTONS */}
        {submitSuccess && lastLoggedBooking && (
          <div className="mt-5 p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn text-emerald-300 text-xs text-left">
            <div className="flex items-center gap-3.5">
              <div className="h-9 w-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <Check className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-bold text-white text-sm flex items-center gap-2">
                  <span>Booking Locked:</span>
                  <span className="text-purple-300 underline font-black">{lastLoggedBooking.name}</span>
                </p>
                <p className="text-[11px] text-emerald-300/90 font-mono mt-0.5">
                  📅 {lastLoggedBooking.date} • {lastLoggedBooking.hours} hours • ₹{lastLoggedBooking.amount.toLocaleString()} billed • Logged to schedule & timeline.
                </p>
              </div>
            </div>

            {onNavigateTab && (
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => onNavigateTab("timeline")}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-purple-600/30 cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  <span>View in Log Timeline</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab("schedule")}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1 border border-white/10 cursor-pointer transition-all"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>View Schedule</span>
                </button>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
