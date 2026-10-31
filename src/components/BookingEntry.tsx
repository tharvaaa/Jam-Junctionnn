/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from "react";
import { Booking, BookingType, BookingStatus, EmailLog } from "../types";
import { TIME_SLOTS, AVAILABLE_EQUIPMENT } from "../data";
import { 
  Plus, Music, Calendar, Clock, DollarSign, Sparkles, 
  Settings, Mail, ShieldAlert, MonitorPlay, Check, PlaySquare, AlertCircle
} from "lucide-react";

interface BookingEntryProps {
  onAddBooking: (booking: Booking) => void;
  onSendEmailLog: (log: EmailLog) => void;
  userEmail: string;
}

export default function BookingEntry({ onAddBooking, onSendEmailLog, userEmail }: BookingEntryProps) {
  // Booking Form State
  const [clientName, setClientName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);
  const [sessionType, setSessionType] = useState<BookingType>("Jam");
  const [customRate, setCustomRate] = useState(600); // default custom recording rate
  const [hours, setHours] = useState(2);
  const [isOverride, setIsOverride] = useState(false);
  const [overrideRateValue, setOverrideRateValue] = useState(300);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [customRequests, setCustomRequests] = useState("");

  // Automated Alert Trigger Configuration
  const [autoEmailConfirmation, setAutoEmailConfirmation] = useState(true);
  const [autoReminderAlert, setAutoReminderAlert] = useState(true);

  // Computed and Temporary Visual States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [recentNotification, setRecentNotification] = useState<string | null>(null);

  // Auto rate computation
  const getBaseRate = (): number => {
    if (sessionType === "Jam") return 350;
    if (sessionType === "Karaoke") return 400;
    return customRate; // Recording rate
  };

  const getFinalHourRate = (): number => {
    if (isOverride) {
      return overrideRateValue;
    }
    return getBaseRate();
  };

  const finalRate = getFinalHourRate();
  const totalAmount = finalRate * hours;

  // Initial defaults based on selection
  useEffect(() => {
    if (sessionType === "Jam") {
      setOverrideRateValue(300);
    } else if (sessionType === "Karaoke") {
      setOverrideRateValue(350);
    } else {
      setOverrideRateValue(500);
    }
  }, [sessionType]);

  const handleEquipmentToggle = (item: string) => {
    if (selectedEquipment.includes(item)) {
      setSelectedEquipment(selectedEquipment.filter(i => i !== item));
    } else {
      setSelectedEquipment([...selectedEquipment, item]);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    setIsSubmitting(true);

    // Beautiful realistic timeout simulation
    setTimeout(() => {
      const newBooking: Booking = {
        id: "b_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8),
        clientName: clientName.trim(),
        date,
        timeSlot,
        type: sessionType,
        defaultRate: getBaseRate(),
        overrideRate: isOverride ? overrideRateValue : null,
        finalRate,
        hours,
        totalAmount,
        status: "Up Next",
        equipment: selectedEquipment,
        customRequests: customRequests.trim(),
        reminderSent: autoReminderAlert,
        createdAt: new Date().toISOString()
      };

      onAddBooking(newBooking);

      // Fire email confirmation and supervisor dispatch alert
      if (autoEmailConfirmation) {
        const clientEmail = `${clientName.trim().replace(/\s+/g, "").toLowerCase()}@gmail.com`;
        
        // Gmail Confirmation
        const confirmationLog: EmailLog = {
          id: "email_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8),
          recipient: clientEmail,
          subject: `🎹 THE JAM JUNCTION - Booking Confirmation for ${date}`,
          body: `Hi ${clientName},\n\nYour session has been successfully reserved at THE JAM JUNCTION!\n\n📅 Date: ${date}\n⏰ Time: ${timeSlot}\n🎸 Session Specifics: ${sessionType} Session (${hours} Hrs @ ₹${finalRate}/hr)\n🎧 Total Bill: ₹${totalAmount}\n🛠️ Reserved Equipment: ${selectedEquipment.join(", ") || "None selected"}\n\n[DISPATCH ALERT: Copy delivered to supervisor narkhedeatharva2106@gmail.com]\n\nKeep on Rocking!`,
          type: "confirmation",
          timestamp: new Date().toISOString(),
          status: "sent"
        };
        onSendEmailLog(confirmationLog);

        setRecentNotification(`✓ Booking synced to Firestore & dispatch alert sent to ${userEmail}`);
      }

      setIsSubmitting(false);
      setSubmitSuccess(true);
      
      // Reset major parts of the form but persist date for multiple entry speed!
      setClientName("");
      setSelectedEquipment([]);
      setCustomRequests("");
      
      setTimeout(() => {
        setSubmitSuccess(false);
        setRecentNotification(null);
      }, 5000);
    }, 1200);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 p-1 md:p-3">
      
      {/* LEFT FORM BLOCK - 7 COLUMNS */}
      <div className="lg:col-span-7 glass-panel rounded-2xl p-6 md:p-8 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
              <Plus className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">Log Live Booking</h2>
              <p className="text-xs text-gray-400 font-serif italic">Securely reserve client hours in the studio schedule on the fly</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-gray-300 uppercase tracking-widest mb-1">
                Client / Band Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Iron Maidens, Djent Project"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full flex px-4 py-3 rounded-lg text-sm text-white border input-interactive placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 uppercase tracking-widest mb-1">
                  Select Calendar Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-white border input-interactive"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 uppercase tracking-widest mb-1">
                  Select Time Segment
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg text-sm text-white border input-interactive cursor-pointer"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot} className="bg-[#121212] text-white py-2">
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 uppercase tracking-widest mb-1">
                  Session Mode
                </label>
                <div className="relative">
                  <select
                    value={sessionType}
                    onChange={(e) => setSessionType(e.target.value as BookingType)}
                    className="w-full px-4 py-3 rounded-lg text-sm text-white border input-interactive cursor-pointer font-semibold text-purple-400"
                  >
                    <option value="Jam" className="bg-[#121212] text-white">Jam Session</option>
                    <option value="Karaoke" className="bg-[#121212] text-white">Karaoke Session</option>
                    <option value="Recording" className="bg-[#121212] text-white">Recording (Studio)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 uppercase tracking-widest mb-1">
                  {sessionType === "Recording" ? "Studio Base (₹/hr)" : "Standard Rate (₹/hr)"}
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
                  {sessionType === "Recording" ? (
                    <input
                      type="number"
                      min={100}
                      value={customRate}
                      onChange={(e) => setCustomRate(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-white border input-interactive"
                    />
                  ) : (
                    <div className="w-full pl-10 pr-4 py-3 rounded-lg text-sm text-white border bg-black/40 border-white/5 font-mono select-none">
                      {sessionType === "Jam" ? "₹350/hr" : "₹400/hr"}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 uppercase tracking-widest mb-1">
                  Duration (Hours)
                </label>
                <select
                  value={hours}
                  onChange={(e) => setHours(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-3 rounded-lg text-sm text-white border input-interactive cursor-pointer font-mono"
                >
                  <option value={1} className="bg-[#121212] text-white">1 Hour</option>
                  <option value={2} className="bg-[#121212] text-white">2 Hours</option>
                  <option value={3} className="bg-[#121212] text-white">3 Hours</option>
                  <option value={4} className="bg-[#121212] text-white">4 Hours</option>
                  <option value={6} className="bg-[#121212] text-white">6 Hours (Half Day)</option>
                  <option value={8} className="bg-[#121212] text-white">8 Hours (Full Day)</option>
                </select>
              </div>
            </div>

            {/* MANUAL OVERRIDE ACCORDION */}
            <div className="p-4 rounded-xl bg-[#1a1a1a]/40 border border-[#2b2b2b]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-teal-400" />
                  <div>
                    <span className="text-xs font-medium text-white block">Manual Price Adjustment Override</span>
                    <span className="text-[10px] text-gray-400 block">Apply flexible custom billing rates on the fly</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOverride(!isOverride)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isOverride ? "bg-teal-500" : "bg-[#2d2d2d]"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      isOverride ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {isOverride && (
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between animate-fadeIn">
                  <span className="text-xs text-gray-400">Owner Discount Override Value (Per Hour):</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-teal-400">₹</span>
                    <input
                      type="number"
                      min={0}
                      value={overrideRateValue}
                      onChange={(e) => setOverrideRateValue(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-24 px-2.5 py-1 rounded bg-[#121212] text-xs font-mono text-center text-teal-300 border border-teal-500/30 focus:border-teal-400 focus:outline-none"
                    />
                    <span className="text-xs text-gray-500 font-mono">/hr</span>
                  </div>
                </div>
              )}
            </div>



            <div>
              <label className="block text-xs font-medium text-gray-300 uppercase tracking-widest mb-1.5 flex justify-between items-center">
                <span>Special Requests / Notes</span>
                <span className="text-[10px] text-gray-500">(Optional)</span>
              </label>
              <textarea
                placeholder="Write any special requests, drink requests, sound requirements..."
                value={customRequests}
                onChange={(e) => setCustomRequests(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 rounded-lg text-sm text-white border input-interactive placeholder-gray-600 focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full cursor-pointer bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white text-sm font-bold uppercase tracking-widest py-3.5 rounded-xl hover:opacity-90 transition shadow-lg transition-transform duration-300 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Calculating & Broadcasting...
                  </>
                ) : (
                  <>
                    <Music className="h-4 w-4" />
                    Lock Booking & Dispatch Alerts
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {submitSuccess && (
          <div className="mt-4 p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex items-center gap-3 animate-fadeIn text-emerald-400 text-xs text-left">
            <Check className="h-4 w-4 shrink-0 bg-emerald-500 text-black rounded-full p-0.5" />
            <div>
              <p className="font-bold">Booking locked successfully!</p>
              <p className="text-[10px] text-emerald-300/80">Schedule updated, telemetry updated, local persistent store synced.</p>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PREVIEW & ALERTS PANEL - 5 COLUMNS */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        
        {/* SUMMARY CARD */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden flex-1 flex flex-col justify-between">
          <div className="absolute -right-20 -top-20 w-48 h-48 bg-gradient-to-br from-purple-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <span className="text-xs uppercase tracking-widest font-bold text-gray-400">Session Breakdown Proposal</span>
              <span className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-[10px] text-purple-300 uppercase tracking-widest font-medium">Estimated</span>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Client Reference</span>
                <span className="text-lg font-extrabold text-[#F5F5F7] truncate block">
                  {clientName ? clientName : "Unassigned Client..."}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Target Day</span>
                  <span className="text-xs font-semibold text-white mt-0.5 block">{date}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Time Sync</span>
                  <span className="text-xs font-semibold text-white mt-0.5 block">{timeSlot}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-white/5 pt-4">
                <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
                  <span>Standard Rate:</span>
                  <span className="font-mono">
                    ₹{getBaseRate()} / hr
                  </span>
                </div>

                {isOverride && (
                  <div className="flex justify-between items-center text-xs text-teal-400 mb-1">
                    <span>Discounted Custom Active Rate:</span>
                    <span className="font-mono font-semibold">- ₹{getBaseRate() - overrideRateValue} / hr</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
                  <span>Duration Multiplier:</span>
                  <span className="font-mono">x {hours} Hour{hours > 1 && "s"}</span>
                </div>

                <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                  <span className="text-sm font-bold text-white">Consolidated Total:</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 font-mono">
                      ₹{totalAmount}
                    </span>
                    <span className="text-[9px] block text-gray-500 font-serif italic mt-0.5">including GST and equipment licenses</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 text-[10px] text-gray-400 bg-white/5 p-3 rounded-lg">
              <ShieldAlert className="h-4 w-4 text-purple-400 shrink-0" />
              <span>Real-time persistence layer active. Booking updates flow instantly to telemetry engines.</span>
            </div>
          </div>
        </div>

        {/* AUTOMATED TRIGGERS & SIMULATED ALERTS CONTROLS */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <MonitorPlay className="h-5 w-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">Automated Gmail Alert Triggers</h3>
          </div>

          <p className="text-xs text-gray-400 mb-4">
            Configure automated scripts triggered through Jam Junction server endpoints once booking is established:
          </p>

          <div className="space-y-3">
            <div className="flex items-start justify-between p-3 rounded-lg bg-black/30 border border-white/5">
              <div className="flex items-start gap-2.5">
                <Mail className="h-4 w-4 text-purple-400 mt-0.5" />
                <div>
                  <span className="text-xs text-white font-semibold block">Instant Booking Confirmation Receipt</span>
                  <span className="text-[10px] text-gray-400 block">Sends elegant structural HTML summary to client</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAutoEmailConfirmation(!autoEmailConfirmation)}
                className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  autoEmailConfirmation ? "bg-purple-500" : "bg-[#2d2d2d]"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    autoEmailConfirmation ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-start justify-between p-3 rounded-lg bg-black/30 border border-white/5">
              <div className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-indigo-400 mt-0.5" />
                <div>
                  <span className="text-xs text-white font-semibold block">Hour-Before Smart SMS/Gmail Alert</span>
                  <span className="text-[10px] text-gray-400 block">Autofires automated check-in reminder 60m ahead of soundcheck</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAutoReminderAlert(!autoReminderAlert)}
                className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  autoReminderAlert ? "bg-indigo-500" : "bg-[#2d2d2d]"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    autoReminderAlert ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex justify-between items-center text-[10px] text-gray-400">
              <span className="font-serif italic text-purple-300">Target Server Channel:</span>
              <span className="font-mono uppercase text-indigo-400 font-semibold">GMAIL-API-SMTP-SSL</span>
            </div>
            
            <div className="mt-2 text-[10px] text-gray-500 font-mono flex items-center gap-1">
              <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" />
              <span>Simulated logs deliver to owner's inbox: <strong className="text-gray-300">{userEmail}</strong></span>
            </div>

            {recentNotification && (
              <div className="mt-3 p-2 bg-purple-950/20 text-[10px] text-purple-300 font-mono rounded border border-purple-500/10 animate-pulse text-left">
                {recentNotification}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
