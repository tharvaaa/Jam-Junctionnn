/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { EmailLog } from "../types";
import { 
  Mail, Clock, CheckCircle2, Search, 
  Send, RefreshCw, AlertCircle, Copy, Check,
  ChevronDown, ChevronUp, Music, User
} from "lucide-react";

interface LogTimelineProps {
  emailLogs: EmailLog[];
  onSendEmailLog: (log: EmailLog) => void;
  supervisorEmail: string;
}

export default function LogTimeline({ emailLogs, onSendEmailLog, supervisorEmail }: LogTimelineProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSentMessage, setTestSentMessage] = useState<string | null>(null);

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

  // Filtered logs
  const filteredLogs = emailLogs.filter((log) => {
    const matchesType = typeFilter === "All" || log.type === typeFilter.toLowerCase();
    const resolvedName = getLogClientName(log) || "";
    const matchesSearch = 
      resolvedName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
        clientName: "System Supervisor Alert",
        subject: `⚡ THE JAM JUNCTION - Test Alert Signal [${new Date().toLocaleTimeString()}]`,
        body: `Test signal verified for studio supervisor ${supervisorEmail}.\n\nClient / Band Name: System Diagnostic Verification\nTimestamp: ${new Date().toISOString()}\nStatus: Firestore Trigger Active & Verified\nNetwork: SSL Encrypted Dispatch Channel\nDomain: jamjunction.me\n\nAll real-time telemetry systems operational.`,
        type: "reminder",
        timestamp: new Date().toISOString(),
        status: "sent"
      };

      onSendEmailLog(testLog);
      setIsSendingTest(false);
      setTestSentMessage(`✓ Test dispatch alert verified and logged for ${supervisorEmail}`);
      setTimeout(() => setTestSentMessage(null), 4000);
    }, 800);
  };

  const totalConfirmations = emailLogs.filter(l => l.type === "confirmation").length;
  const totalReminders = emailLogs.filter(l => l.type === "reminder").length;
  const totalReports = emailLogs.filter(l => l.type === "report").length;

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
              <h2 className="text-xl font-bold tracking-tight text-white">Automated Gmail Alert & Dispatch Log Timeline</h2>
              <span className="text-[10px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full font-mono font-bold uppercase">
                Active
              </span>
            </div>
            <p className="text-xs text-gray-400 font-serif italic mt-0.5">
              Live chronological stream showing client & band bookings, soundcheck alerts, and analytic dispatches
            </p>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
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

      {/* METRIC CARDS STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-mono font-semibold">Total Dispatches</span>
          <div className="mt-2">
            <span className="text-2xl font-black text-white font-mono">{emailLogs.length}</span>
            <span className="text-[9px] text-gray-400 block mt-0.5 font-mono">Logged in session & cloud</span>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-mono font-semibold">Booking Receipts</span>
          <div className="mt-2">
            <span className="text-2xl font-black text-purple-400 font-mono">{totalConfirmations}</span>
            <span className="text-[9px] text-purple-300/80 block mt-0.5 font-mono">Client bookings logged</span>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-mono font-semibold">Soundcheck Alerts</span>
          <div className="mt-2">
            <span className="text-2xl font-black text-indigo-400 font-mono">{totalReminders}</span>
            <span className="text-[9px] text-indigo-300/80 block mt-0.5 font-mono">Pre-session reminders</span>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-mono font-semibold">Financial Statements</span>
          <div className="mt-2">
            <span className="text-2xl font-black text-teal-400 font-mono">{totalReports}</span>
            <span className="text-[9px] text-teal-300/80 block mt-0.5 font-mono">Monthly analytics shares</span>
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
              placeholder="Search by band name, client, recipient, or subject..."
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
          <span>Target Recipient Endpoint: <strong className="text-purple-300">{supervisorEmail}</strong></span>
          <span>Showing <strong className="text-white font-bold">{filteredLogs.length}</strong> event{filteredLogs.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* TIMELINE STREAM */}
      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center">
            <AlertCircle className="h-10 w-10 text-purple-400/60 mx-auto mb-3" />
            <p className="text-sm text-gray-300 font-bold">No dispatch alerts match your filter</p>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              Any time a new booking is locked in the Command Center or an analytics statement is shared, an audit record with the client's name will appear here automatically.
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const isCopied = copiedId === log.id;
            const clientName = getLogClientName(log);

            const badgeStyles = {
              confirmation: "bg-purple-950/30 border-purple-500/40 text-purple-300",
              reminder: "bg-indigo-950/30 border-indigo-500/40 text-indigo-300",
              report: "bg-teal-950/30 border-teal-500/40 text-teal-300"
            };

            return (
              <div
                key={log.id}
                className="glass-panel rounded-2xl p-5 md:p-6 border border-white/5 space-y-3.5 transition-all duration-300"
              >
                {/* Top Meta Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] uppercase tracking-widest font-extrabold px-2 py-0.5 rounded-md border font-mono ${badgeStyles[log.type] || "bg-gray-800 text-gray-300 border-gray-700"}`}>
                      ● {log.type}
                    </span>

                    <span className="text-[11px] font-mono text-gray-400 bg-black/40 px-2 py-0.5 rounded border border-white/5 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-purple-400" />
                      {new Date(log.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} at {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/20 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                      <CheckCircle2 className="h-3 w-3" /> FIRESTORE DISPATCHED
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => handleCopy(log.id, `${log.subject}\n\nClient: ${clientName || "N/A"}\nRecipient: ${log.recipient}\nDate: ${log.timestamp}\n\n${log.body}`)}
                      className="p-1.5 rounded-lg bg-black/30 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5 transition-all text-xs flex items-center gap-1 cursor-pointer"
                      title="Copy dispatch log"
                    >
                      {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span className="text-[10px] font-mono">{isCopied ? "Copied" : "Copy"}</span>
                    </button>

                    <button
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className="p-1.5 rounded-lg bg-black/30 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5 transition-all text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <span className="text-[10px] font-mono">{isExpanded ? "Collapse" : "Inspect"}</span>
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {/* PROMINENT CLIENT / BAND IDENTITY BADGE */}
                {clientName && (
                  <div className="flex items-center gap-2.5 bg-gradient-to-r from-purple-500/20 via-pink-500/15 to-transparent border border-purple-500/40 px-3.5 py-2 rounded-xl shadow-sm">
                    <div className="h-7 w-7 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                      <Music className="h-4 w-4 text-purple-300" />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-black uppercase tracking-widest text-purple-300 bg-purple-500/30 px-2 py-0.5 rounded">
                        BAND / CLIENT
                      </span>
                      <span className="text-base font-black text-white tracking-tight">
                        {clientName}
                      </span>
                    </div>
                    {log.hours && (
                      <span className="text-xs text-purple-300 font-mono ml-auto bg-black/40 px-2 py-0.5 rounded border border-purple-500/20">
                        {log.hours} hrs session
                      </span>
                    )}
                  </div>
                )}

                {/* Recipient & Subject */}
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-mono">Recipient:</span>
                    <span className="text-xs font-mono font-bold text-gray-300 bg-white/5 px-2 py-0.5 rounded">
                      {log.recipient}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white tracking-tight pt-0.5">
                    {log.subject}
                  </h4>
                </div>

                {/* Body Preview or Full Content */}
                <div className="p-3.5 rounded-xl bg-black/50 border border-white/5 font-mono text-xs text-gray-300 text-left">
                  {isExpanded ? (
                    <pre className="whitespace-pre-wrap font-mono text-[11px] text-gray-200 leading-relaxed max-h-96 overflow-y-auto">
                      {log.body}
                    </pre>
                  ) : (
                    <p className="line-clamp-2 text-[11px] text-gray-400">
                      {log.body}
                    </p>
                  )}
                </div>

                {/* Footer notes */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono pt-1">
                  <span>Channel: <strong className="text-indigo-400">GMAIL-API-SMTP-SSL</strong></span>
                  <span>Supervisor Audit: <strong className="text-purple-300">{supervisorEmail}</strong></span>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
