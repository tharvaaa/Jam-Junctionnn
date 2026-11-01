/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { EmailLog, Booking } from "../types";
import { 
  Mail, Clock, CheckCircle2, Search, 
  Send, RefreshCw, AlertCircle, Copy, Check,
  ChevronDown, ChevronUp, Music, Trash2, DollarSign,
  Phone, Radio, MessageSquare
} from "lucide-react";
import LiveCountdown from "./LiveCountdown";

interface LogTimelineProps {
  emailLogs: EmailLog[];
  bookings?: Booking[];
  onSendEmailLog: (log: EmailLog) => void;
  supervisorEmail: string;
  onClearAllLogs: () => void;
  onUpdateBookingStatus?: (id: string, newStatus: any, updates?: Partial<Booking>) => void;
}

export default function LogTimeline({ 
  emailLogs, 
  bookings = [], 
  onSendEmailLog, 
  supervisorEmail, 
  onClearAllLogs,
  onUpdateBookingStatus 
}: LogTimelineProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSentMessage, setTestSentMessage] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Helper to resolve client name from log or parse from subject/body
  const getLogClientName = (log: EmailLog): string | null => {
    if (log.clientName && log.clientName.trim()) return log.clientName.trim();
    
    // Pattern: "🎸 ClientName — Booking Locked" or "🎸 ClientName -"
    const matchEmoji = log.subject.match(/🎸\s*([^—–-]+?)\s*[—–-]/);
    if (matchEmoji && matchEmoji[1]) return matchEmoji[1].trim();

    // Pattern: "(ClientName)" in subject
    const matchParen = log.subject.match(/\(([^)]+)\)/);
    if (matchParen && matchParen[1]) return matchParen[1].trim();

    // Pattern in body: "Client / Band Name: ClientName" or "Hi ClientName,"
    const matchBodyName = log.body.match(/Client \/ Band Name:\s*([^\n\r]+)/);
    if (matchBodyName && matchBodyName[1]) return matchBodyName[1].trim();

    const matchHi = log.body.match(/Hi\s+([^\n\r,]+),/);
    if (matchHi && matchHi[1]) return matchHi[1].trim();

    return null;
  };

  // Helper to resolve client mobile phone number from log, body or bookings
  const getLogPhoneNumber = (log: EmailLog): string | null => {
    if (log.phoneNumber && log.phoneNumber.trim()) return log.phoneNumber.trim();

    // Cross reference with bookings state if available
    if (bookings && bookings.length > 0) {
      if (log.bookingId) {
        const found = bookings.find(b => b.id === log.bookingId);
        if (found?.phoneNumber) return found.phoneNumber;
      }
      const clientName = getLogClientName(log);
      if (clientName) {
        const found = bookings.find(
          b => b.clientName.toLowerCase() === clientName.toLowerCase() && b.phoneNumber
        );
        if (found?.phoneNumber) return found.phoneNumber;
      }
    }

    // Pattern in body: "📞 Contact Phone: ..." or "📞 Phone Number: ..."
    const matchBodyPhone = log.body.match(/📞\s*(?:Contact Phone|Phone Number)?:\s*([+\d\s-]{8,20})/);
    if (matchBodyPhone && matchBodyPhone[1]) return matchBodyPhone[1].trim();

    return null;
  };

  // Helper to extract amount paid from log
  const getLogAmountPaid = (log: EmailLog): string | null => {
    if (log.totalAmount !== undefined && log.totalAmount !== null) {
      return `₹${log.totalAmount.toLocaleString()}`;
    }
    const matchBody = log.body.match(/Total Bill:\s*₹?([0-9,]+)/i);
    if (matchBody && matchBody[1]) return `₹${matchBody[1]}`;
    
    const matchSubject = log.subject.match(/₹([0-9,]+)/);
    if (matchSubject && matchSubject[1]) return `₹${matchSubject[1]}`;
    
    return null;
  };

  // Filtered logs
  const filteredLogs = emailLogs.filter((log) => {
    const matchesType = typeFilter === "All" || log.type === typeFilter.toLowerCase();
    const resolvedName = getLogClientName(log) || "";
    const phone = getLogPhoneNumber(log) || "";
    const matchesSearch = 
      resolvedName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.body.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDispatchTestAlert = () => {
    if (isSendingTest) return;
    setIsSendingTest(true);
    setTestSentMessage(null);

    setTimeout(() => {
      const testLog: EmailLog = {
        id: "test_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8),
        recipient: supervisorEmail,
        clientName: "System Alert",
        subject: `⚡ JAM JUNCTION - Test Alert Signal [${new Date().toLocaleTimeString()}]`,
        body: `Test signal verified for studio supervisor ${supervisorEmail}.\n\nClient / Band Name: System Diagnostic Verification\nTimestamp: ${new Date().toISOString()}\nStatus: Verified`,
        type: "reminder",
        timestamp: new Date().toISOString(),
        status: "sent"
      };

      onSendEmailLog(testLog);
      setIsSendingTest(false);
      setTestSentMessage(`✓ Test dispatch alert logged`);
      setTimeout(() => setTestSentMessage(null), 4000);
    }, 800);
  };

  const totalConfirmations = emailLogs.filter(l => l.type === "confirmation").length;
  const totalReminders = emailLogs.filter(l => l.type === "reminder").length;
  const totalReports = emailLogs.filter(l => l.type === "report").length;

  const ongoingBookings = bookings.filter((b) => b.status === "Live Now");

  return (
    <div className="space-y-6 relative z-10 p-1 md:p-3">
      
      {/* HEADER & SUMMARY BAR */}
      <div className="glass-panel rounded-2xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center border border-purple-500/30 shadow-lg shadow-purple-500/10">
            <Mail className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white">Log Timeline</h2>
              <span className="text-[10px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full font-mono font-bold uppercase">
                Active
              </span>
            </div>
            <p className="text-xs text-gray-400 font-serif italic mt-0.5">
              Chronological log stream of band sessions, client contacts, payments, and soundcheck alerts
            </p>
          </div>
        </div>

        {/* Action buttons: Clear All & Dispatch Test */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {showClearConfirm ? (
            <div className="flex items-center gap-2 bg-red-950/40 border border-red-500/50 p-1.5 rounded-xl animate-fadeIn">
              <span className="text-[11px] text-red-200 font-bold px-1.5">Clear all logs?</span>
              <button
                onClick={() => {
                  onClearAllLogs();
                  setShowClearConfirm(false);
                }}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold uppercase transition-all cursor-pointer"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-2 py-1 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowClearConfirm(true)}
              disabled={emailLogs.length === 0}
              className="cursor-pointer bg-red-950/30 hover:bg-red-900/40 text-red-300 hover:text-white border border-red-500/30 hover:border-red-500/60 px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              title="Clear all logs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear All Logs</span>
            </button>
          )}

          <button
            onClick={handleDispatchTestAlert}
            disabled={isSendingTest}
            className="flex-1 md:flex-none cursor-pointer bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:opacity-90 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all duration-300 hover:scale-[1.02]"
          >
            {isSendingTest ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Broadcasting...</span>
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                <span>Dispatch Test Alert</span>
              </>
            )}
          </button>
        </div>
      </div>

      {testSentMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{testSentMessage}</span>
        </div>
      )}

      {/* ONGOING LIVE SESSIONS SECTION (LIVE COUNTDOWN IN TIMELINE) */}
      {ongoingBookings.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            <h3 className="text-xs font-black tracking-widest uppercase text-rose-400 font-mono flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
              <span>Ongoing Live Sessions ({ongoingBookings.length}) — Live Countdown</span>
            </h3>
          </div>

          <div className="space-y-3">
            {ongoingBookings.map((b) => (
              <div key={`timeline-live-${b.id}`} className="glass-panel rounded-2xl p-5 border border-rose-500/40 bg-rose-950/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-rose-500/20">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold bg-rose-500/20 text-rose-300 px-2.5 py-0.5 rounded border border-rose-500/30 uppercase">
                      {b.type} Session
                    </span>
                    <h4 className="text-lg font-black text-white uppercase tracking-tight">{b.clientName}</h4>
                  </div>
                  {b.phoneNumber && (
                    <a
                      href={`tel:${b.phoneNumber}`}
                      className="text-xs font-mono font-bold text-emerald-300 hover:text-emerald-200 flex items-center gap-1.5 bg-black/50 px-3 py-1.5 rounded-xl border border-emerald-500/40"
                    >
                      <Phone className="h-3.5 w-3.5 text-emerald-400" />
                      <span>{b.phoneNumber}</span>
                    </a>
                  )}
                </div>

                <LiveCountdown 
                  booking={b} 
                  onUpdateBookingStatus={onUpdateBookingStatus} 
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* METRIC CARDS STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-mono font-semibold">Total Logs</span>
          <div className="mt-2">
            <span className="text-2xl font-black text-white font-mono">{emailLogs.length}</span>
            <span className="text-[9px] text-gray-400 block mt-0.5 font-mono">Logged events</span>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-mono font-semibold">Bookings Locked</span>
          <div className="mt-2">
            <span className="text-2xl font-black text-purple-400 font-mono">{totalConfirmations}</span>
            <span className="text-[9px] text-purple-300/80 block mt-0.5 font-mono">Session logs</span>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-mono font-semibold">Alerts</span>
          <div className="mt-2">
            <span className="text-2xl font-black text-indigo-400 font-mono">{totalReminders}</span>
            <span className="text-[9px] text-indigo-300/80 block mt-0.5 font-mono">Soundcheck alerts</span>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-mono font-semibold">Financial Reports</span>
          <div className="mt-2">
            <span className="text-2xl font-black text-teal-400 font-mono">{totalReports}</span>
            <span className="text-[9px] text-teal-300/80 block mt-0.5 font-mono">Analytics statements</span>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTER CONTROLS */}
      <div className="glass-panel rounded-2xl p-4 md:p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by band name, phone or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs text-white border input-interactive placeholder-gray-600 focus:outline-none"
            />
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5 w-full md:w-auto">
            {["All", "Confirmation", "Reminder", "Report"].map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`flex-1 md:flex-none text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-300 cursor-pointer ${
                  typeFilter === type
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {type === "All" ? "All Logs" : `${type}s`}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-gray-500 pt-2 border-t border-white/5">
          <span>Active Timeline Stream</span>
          <span>Showing <strong className="text-white font-bold">{filteredLogs.length}</strong> log{filteredLogs.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* TIMELINE STREAM - CLEAN LOG CARDS (BAND NAME, AMOUNT PAID, TIMINGS, CLIENT MOBILE) */}
      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center">
            <AlertCircle className="h-10 w-10 text-purple-400/60 mx-auto mb-3" />
            <p className="text-sm text-gray-300 font-bold">No logs to display</p>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              Whenever a session is locked in Command Center, it will appear here showing the band name, client mobile, amount paid, and timings.
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const isCopied = copiedId === log.id;
            const clientName = getLogClientName(log) || "Studio Session";
            const phoneNumber = getLogPhoneNumber(log);
            const amountPaid = getLogAmountPaid(log);
            const timingFormatted = new Date(log.timestamp).toLocaleDateString("en-US", { 
              month: "short", 
              day: "numeric", 
              year: "numeric" 
            }) + " at " + new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const badgeStyles = {
              confirmation: "bg-purple-950/30 border-purple-500/40 text-purple-300",
              reminder: "bg-indigo-950/30 border-indigo-500/40 text-indigo-300",
              report: "bg-teal-950/30 border-teal-500/40 text-teal-300"
            };

            return (
              <div
                key={log.id}
                className="glass-panel rounded-2xl p-5 md:p-6 border border-white/5 space-y-4 transition-all duration-300 hover:border-purple-500/30"
              >
                {/* Header row: Band Name & Action buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  {/* BAND NAME (PROMINENT & CLEAN) */}
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                      <Music className="h-5 w-5 text-purple-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg font-black text-white tracking-tight uppercase">
                          {clientName}
                        </span>
                        <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded border font-mono ${badgeStyles[log.type] || "bg-gray-800 text-gray-300 border-gray-700"}`}>
                          {log.type}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-400 font-mono block">
                        Logged on {timingFormatted}
                      </span>
                    </div>
                  </div>

                  {/* Copy & Inspect Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => handleCopy(log.id, `Band: ${clientName}\nMobile: ${phoneNumber || "N/A"}\nPaid: ${amountPaid || "N/A"}\nTimings: ${log.hours ? `${log.hours}h • ` : ""}${timingFormatted}\nSubject: ${log.subject}\n\n${log.body}`)}
                      className="p-2 rounded-lg bg-black/40 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5 transition-all text-xs flex items-center gap-1.5 cursor-pointer"
                      title="Copy log summary"
                    >
                      {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span className="text-[10px] font-mono">{isCopied ? "Copied" : "Copy"}</span>
                    </button>

                    <button
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className="p-2 rounded-lg bg-black/40 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5 transition-all text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="text-[10px] font-mono">{isExpanded ? "Less" : "Details"}</span>
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {/* ESSENTIAL STATS ROW: HOW MUCH PAID, TIMINGS, AND CLIENT MOBILE */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/5">
                  {/* HOW MUCH PAID */}
                  <div className="bg-black/40 rounded-xl p-3 border border-white/5 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                      <DollarSign className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-gray-400 font-mono block">Amount Paid</span>
                      <span className="text-base font-black font-mono text-emerald-300">
                        {amountPaid || "Recorded"}
                      </span>
                    </div>
                  </div>

                  {/* TIMINGS */}
                  <div className="bg-black/40 rounded-xl p-3 border border-white/5 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                      <Clock className="h-4 w-4 text-purple-400" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-gray-400 font-mono block">Timings & Duration</span>
                      <span className="text-xs font-bold font-mono text-purple-200">
                        {log.hours ? `${log.hours} Hour${log.hours !== 1 ? "s" : ""} Session` : timingFormatted}
                      </span>
                    </div>
                  </div>

                  {/* CLIENT MOBILE NUMBER */}
                  <div className="bg-black/40 rounded-xl p-3 border border-white/5 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                      <Phone className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase tracking-wider text-gray-400 font-mono block">Client Mobile</span>
                      {phoneNumber ? (
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${phoneNumber}`}
                            className="text-xs font-mono font-bold text-emerald-300 hover:text-emerald-200 hover:underline truncate"
                            title="Click to dial client"
                          >
                            {phoneNumber}
                          </a>
                          <a
                            href={`https://wa.me/${phoneNumber.replace(/[^\d]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 text-[10px] shrink-0"
                            title="Open WhatsApp chat"
                          >
                            <MessageSquare className="h-3 w-3" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-xs font-mono text-gray-500 italic">Not on file</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expandable note details if clicked */}
                {isExpanded && (
                  <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-gray-300 text-left animate-fadeIn">
                    <pre className="whitespace-pre-wrap font-mono text-[11px] text-gray-300 leading-relaxed max-h-96 overflow-y-auto">
                      {log.body}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
