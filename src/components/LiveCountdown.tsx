/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Booking } from "../types";
import { Clock, AlertTriangle, Plus, Check, Phone, MessageSquare } from "lucide-react";

interface LiveCountdownProps {
  booking: Booking;
  onUpdateBookingStatus?: (id: string, newStatus: any, updates?: Partial<Booking>) => void;
  onUpdateBooking?: (id: string, updates: Partial<Booking>) => void;
  compact?: boolean;
}

export default function LiveCountdown({ booking, onUpdateBookingStatus, onUpdateBooking, compact = false }: LiveCountdownProps) {
  const [, setTick] = useState(0);

  // Ticking interval every second for live countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const durationMs = (booking.hours || 1) * 3600 * 1000;
  const startMs = booking.startedAt 
    ? new Date(booking.startedAt).getTime() 
    : (booking.createdAt ? new Date(booking.createdAt).getTime() : Date.now());
  const endMs = startMs + durationMs;
  const now = Date.now();
  const remainingMs = endMs - now;
  const isOvertime = remainingMs <= 0;
  const elapsedMs = Math.max(0, now - startMs);
  const percentElapsed = Math.min(100, Math.max(0, Math.round((elapsedMs / durationMs) * 100)));

  const absDiff = Math.abs(remainingMs);
  const hoursLeft = Math.floor(absDiff / 3600000);
  const minsLeft = Math.floor((absDiff % 3600000) / 60000);
  const secsLeft = Math.floor((absDiff % 60000) / 1000);

  const formattedTime = hoursLeft > 0
    ? `${hoursLeft}h ${String(minsLeft).padStart(2, "0")}m ${String(secsLeft).padStart(2, "0")}s`
    : `${String(minsLeft).padStart(2, "0")}:${String(secsLeft).padStart(2, "0")}`;

  const cleanPhone = booking.phoneNumber ? booking.phoneNumber.replace(/[^\d+]/g, "") : "";

  const handleExtend = (extraMinutes: number) => {
    const extraHours = extraMinutes / 60;
    const newHours = Math.round((booking.hours + extraHours) * 2) / 2;
    const newTotal = Math.round(booking.finalRate * newHours);
    if (onUpdateBooking) {
      onUpdateBooking(booking.id, { hours: newHours, totalAmount: newTotal });
    } else if (onUpdateBookingStatus) {
      onUpdateBookingStatus(booking.id, "Live Now", { hours: newHours, totalAmount: newTotal });
    }
  };

  const handleComplete = () => {
    if (onUpdateBookingStatus) {
      onUpdateBookingStatus(booking.id, "Completed");
    }
  };

  if (compact) {
    return (
      <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
        isOvertime 
          ? "bg-rose-950/40 border-rose-500/50 text-rose-200 animate-pulse" 
          : "bg-rose-950/25 border-rose-500/40 text-rose-200"
      }`}>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
          </span>
          <span className="font-mono font-bold uppercase text-[10px] tracking-wider text-rose-300">
            {isOvertime ? "Overtime" : "Live Time Left"}
          </span>
          <span className="font-mono font-black text-sm tracking-tight text-white bg-black/50 px-2 py-0.5 rounded border border-rose-500/30">
            {isOvertime ? `+${formattedTime}` : formattedTime}
          </span>
        </div>

        {booking.phoneNumber && (
          <a
            href={`tel:${cleanPhone}`}
            className="flex items-center gap-1 font-mono text-emerald-300 hover:text-emerald-200 bg-black/40 px-2 py-1 rounded border border-emerald-500/30 text-[11px]"
          >
            <Phone className="h-3 w-3 text-emerald-400" />
            <span>{booking.phoneNumber}</span>
          </a>
        )}
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-2xl border transition-all duration-300 ${
      isOvertime
        ? "bg-gradient-to-r from-rose-950/50 via-red-950/40 to-black/60 border-rose-500/60 shadow-lg shadow-rose-600/20"
        : "bg-gradient-to-r from-rose-950/30 via-purple-950/20 to-black/50 border-rose-500/40 shadow-md shadow-rose-600/10"
    }`}>
      
      {/* Top countdown header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono font-black tracking-widest text-rose-300 block">
              {isOvertime ? "Session Overtime Alert" : "Ongoing Session Live Countdown"}
            </span>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                isOvertime ? "text-rose-400 animate-pulse" : "text-white"
              }`}>
                {isOvertime ? `+${formattedTime} Over` : `${formattedTime} Left`}
              </span>
              <span className="text-[11px] text-gray-400 font-mono">
                ({booking.hours}h slot)
              </span>
            </div>
          </div>
        </div>

        {/* Client Mobile Number Display with Direct Call & WhatsApp buttons */}
        {booking.phoneNumber ? (
          <div className="flex items-center gap-2 bg-black/60 p-1.5 px-3 rounded-xl border border-emerald-500/30">
            <div className="text-left">
              <span className="text-[9px] uppercase tracking-wider text-gray-400 font-mono block">Client Mobile</span>
              <a
                href={`tel:${cleanPhone}`}
                className="text-xs font-mono font-bold text-emerald-300 hover:text-emerald-200 flex items-center gap-1.5 transition-colors"
                title="Click to call client"
              >
                <Phone className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>{booking.phoneNumber}</span>
              </a>
            </div>

            <div className="flex items-center gap-1 pl-2 border-l border-white/10">
              <a
                href={`https://wa.me/${cleanPhone.replace('+', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 hover:text-white border border-emerald-500/30 transition-all text-[10px] font-mono flex items-center gap-1"
                title="Message on WhatsApp"
              >
                <MessageSquare className="h-3 w-3" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="text-[11px] font-mono text-gray-500 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
            No client phone registered
          </div>
        )}
      </div>

      {/* Visual Elapsed Progress Bar */}
      <div className="mt-3.5 space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
          <span>Progress: {percentElapsed}% elapsed</span>
          <span>{isOvertime ? "Slot completed - wrap up" : `${Math.max(0, 100 - percentElapsed)}% remaining`}</span>
        </div>
        <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden border border-white/10">
          <div 
            className={`h-full transition-all duration-1000 ${
              isOvertime 
                ? "bg-rose-500 animate-pulse w-full" 
                : percentElapsed > 85 
                ? "bg-amber-400" 
                : "bg-gradient-to-r from-purple-500 to-rose-500"
            }`}
            style={{ width: `${percentElapsed}%` }}
          />
        </div>
      </div>

      {/* Engineer Live Controls: Extend Duration & Settle/Complete */}
      <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono uppercase text-gray-400 mr-1">Extend:</span>
          <button
            type="button"
            onClick={() => handleExtend(15)}
            className="px-2.5 py-1 rounded-lg bg-black/50 hover:bg-white/10 border border-white/10 hover:border-purple-500/40 text-gray-200 hover:text-white text-[11px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer"
            title="Extend booking by 15 minutes"
          >
            <Plus className="h-3 w-3 text-purple-400" />
            <span>+15m</span>
          </button>
          <button
            type="button"
            onClick={() => handleExtend(30)}
            className="px-2.5 py-1 rounded-lg bg-black/50 hover:bg-white/10 border border-white/10 hover:border-purple-500/40 text-gray-200 hover:text-white text-[11px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer"
            title="Extend booking by 30 minutes"
          >
            <Plus className="h-3 w-3 text-purple-400" />
            <span>+30m</span>
          </button>
          <button
            type="button"
            onClick={() => handleExtend(60)}
            className="px-2.5 py-1 rounded-lg bg-black/50 hover:bg-white/10 border border-white/10 hover:border-purple-500/40 text-gray-200 hover:text-white text-[11px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer"
            title="Extend booking by 1 hour"
          >
            <Plus className="h-3 w-3 text-purple-400" />
            <span>+1 hr</span>
          </button>
        </div>

        {onUpdateBookingStatus && (
          <button
            type="button"
            onClick={handleComplete}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer hover:scale-[1.02]"
            title="Finish ongoing session and mark settled"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Complete Session</span>
          </button>
        )}
      </div>

    </div>
  );
}
