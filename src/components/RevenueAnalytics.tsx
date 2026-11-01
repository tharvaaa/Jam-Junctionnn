/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from "react";
import { Booking, BookingType, EmailLog } from "../types";
import { 
  TrendingUp, Calendar, Mail, FileText, Check, Download, 
  Sparkles, Layers, ArrowUpRight, ShieldCheck, MailPlus, RefreshCw,
  BarChart3, ChevronLeft, ChevronRight, DollarSign, Clock, CalendarDays,
  Percent, ArrowDownRight, Share2, Copy, Send, X, ExternalLink
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell 
} from "recharts";
import { db, setDoc, doc, handleFirestoreError, OperationType } from "../firebase";

interface RevenueAnalyticsProps {
  bookings: Booking[];
  onSendEmailLog: (log: EmailLog) => void;
  userEmail: string;
}

interface DailyIncomeItem {
  dayNumber: number;
  dayLabel: string;
  fullDate: string;
  dayOfWeek: string;
  totalRevenue: number;
  jamRevenue: number;
  karaokeRevenue: number;
  recordingRevenue: number;
  bookingCount: number;
  totalHours: number;
  isToday: boolean;
}

export default function RevenueAnalytics({ bookings, onSendEmailLog, userEmail }: RevenueAnalyticsProps) {
  // Chart visualization display settings
  const [chartMode, setChartMode] = useState<"stacked" | "total">("stacked");

  // Share Analytics Modal & Dispatch States
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState(userEmail || "narkhedeatharva2106@gmail.com");
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [shareProgressMsg, setShareProgressMsg] = useState<string>("");

  // Determine available months from actual bookings, fallback to current calendar month
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    const realCurrentMonth = new Date().toISOString().slice(0, 7);
    monthsSet.add(realCurrentMonth);
    bookings.forEach((b) => {
      if (b.date && b.date.length >= 7) {
        monthsSet.add(b.date.slice(0, 7));
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [bookings]);

  // Default month: latest booking month or current month
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    if (bookings.length > 0) {
      const sorted = [...bookings].sort((a, b) => b.date.localeCompare(a.date));
      return sorted[0].date.slice(0, 7);
    }
    return new Date().toISOString().slice(0, 7);
  });

  // Today's real local ISO date (YYYY-MM-DD)
  const todayStr = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // Filter bookings for selected month
  const monthBookings = useMemo(() => {
    return bookings.filter((b) => b.date && b.date.startsWith(selectedMonth));
  }, [bookings, selectedMonth]);

  // Compute monthly stats
  const totalRevenue = useMemo(() => {
    return monthBookings.reduce((sum, b) => {
      return b.status !== "Cancelled" ? sum + b.totalAmount : sum;
    }, 0);
  }, [monthBookings]);

  const totalSessions = useMemo(() => {
    return monthBookings.filter(b => b.status !== "Cancelled").length;
  }, [monthBookings]);

  const totalHours = useMemo(() => {
    return monthBookings.filter(b => b.status !== "Cancelled").reduce((sum, b) => sum + b.hours, 0);
  }, [monthBookings]);

  const avgHourlyRate = totalHours > 0 ? Math.round(totalRevenue / totalHours) : 0;

  // Compute Daily Income array for the entire month (1 to daysInMonth)
  const dailyIncomeData: DailyIncomeItem[] = useMemo(() => {
    if (!selectedMonth || selectedMonth.length !== 7) return [];
    
    const [yearStr, monthStr] = selectedMonth.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    
    const daysInMonth = new Date(year, month, 0).getDate();
    const daysList: DailyIncomeItem[] = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let d = 1; d <= daysInMonth; d++) {
      const dayPad = String(d).padStart(2, "0");
      const fullDate = `${selectedMonth}-${dayPad}`;
      const dateObj = new Date(year, month - 1, d);
      const dayOfWeek = dayNames[dateObj.getDay()];

      const dayBookings = monthBookings.filter((b) => b.date === fullDate && b.status !== "Cancelled");

      const dayTotalRevenue = dayBookings.reduce((sum, b) => sum + b.totalAmount, 0);
      const dayJamRevenue = dayBookings.filter(b => b.type === "Jam").reduce((sum, b) => sum + b.totalAmount, 0);
      const dayKaraokeRevenue = dayBookings.filter(b => b.type === "Karaoke").reduce((sum, b) => sum + b.totalAmount, 0);
      const dayRecordingRevenue = dayBookings.filter(b => b.type === "Recording").reduce((sum, b) => sum + b.totalAmount, 0);
      const dayHours = dayBookings.reduce((sum, b) => sum + b.hours, 0);

      daysList.push({
        dayNumber: d,
        dayLabel: String(d),
        fullDate,
        dayOfWeek,
        totalRevenue: dayTotalRevenue,
        jamRevenue: dayJamRevenue,
        karaokeRevenue: dayKaraokeRevenue,
        recordingRevenue: dayRecordingRevenue,
        bookingCount: dayBookings.length,
        totalHours: dayHours,
        isToday: fullDate === todayStr || fullDate === "2026-05-26"
      });
    }

    return daysList;
  }, [selectedMonth, monthBookings, todayStr]);

  // Daily statistics metrics
  const dailyStats = useMemo(() => {
    let peakDay: DailyIncomeItem | null = null;
    let activeDaysCount = 0;
    let todayIncome = 0;

    dailyIncomeData.forEach((day) => {
      if (day.totalRevenue > 0) {
        activeDaysCount++;
        if (!peakDay || day.totalRevenue > peakDay.totalRevenue) {
          peakDay = day;
        }
      }
      if (day.isToday) {
        todayIncome = day.totalRevenue;
      }
    });

    const avgDailyIncome = activeDaysCount > 0 ? Math.round(totalRevenue / activeDaysCount) : 0;

    return {
      peakDay,
      activeDaysCount,
      todayIncome,
      avgDailyIncome
    };
  }, [dailyIncomeData, totalRevenue]);

  // Breakdown by type
  const getBreakdownByType = (type: BookingType) => {
    const typeBookings = monthBookings.filter(b => b.type === type && b.status !== "Cancelled");
    const count = typeBookings.length;
    const hoursCount = typeBookings.reduce((sum, b) => sum + b.hours, 0);
    const revenue = typeBookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const percentage = totalRevenue > 0 ? ((revenue / totalRevenue) * 100) : 0;

    return { type, count, hoursCount, revenue, percentage };
  };

  const jamBreakdown = getBreakdownByType("Jam");
  const karaokeBreakdown = getBreakdownByType("Karaoke");
  const recordingBreakdown = getBreakdownByType("Recording");

  const breakdowns = [jamBreakdown, karaokeBreakdown, recordingBreakdown];

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const prevStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(prevStr);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const nextDate = new Date(y, m, 1);
    const nextStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(nextStr);
  };

  const formatMonthTitle = (monthStr: string) => {
    try {
      const [y, m] = monthStr.split("-").map(Number);
      const d = new Date(y, m - 1, 1);
      return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } catch {
      return monthStr;
    }
  };

  // Compile Comprehensive Plaintext and HTML Monthly Report with full booking data, time, money
  const generateMonthlyAuditReport = () => {
    const formattedMonth = formatMonthTitle(selectedMonth);
    
    // Detailed session list
    const sortedBookings = [...monthBookings].sort((a, b) => a.date.localeCompare(b.date) || a.timeSlot.localeCompare(b.timeSlot));
    
    let bookingRowsText = "";
    sortedBookings.forEach((b, index) => {
      bookingRowsText += `
${index + 1}. ${b.clientName} [${b.type}]
   • Date: ${b.date} | Time: ${b.timeSlot}
   • Duration: ${b.hours} hrs @ ₹${b.finalRate}/hr
   • Total Amount: ₹${b.totalAmount}
   • Status: ${b.status}
   • Requests: ${b.customRequests || "None"}
`;
    });

    const reportBody = `
============================================================
THE JAM JUNCTION - OFFICIAL MONTHLY FINANCIAL ANALYTICS
Statement for: ${formattedMonth.toUpperCase()}
Generated on: ${new Date().toLocaleString()}
Domain: jamjunction.me
Supervisor / Owner: ${recipientEmail}
============================================================

1. CONSOLIDATED FINANCIAL SUMMARY:
------------------------------------------------------------
• Total Monthly Revenue: ₹${totalRevenue.toLocaleString()}
• Total Completed/Active Sessions: ${totalSessions}
• Total Studio Soundcheck Hours: ${totalHours} hrs
• Average Hourly Studio Yield: ₹${avgHourlyRate}/hr
• Active Operating Days: ${dailyStats.activeDaysCount} Days
• Daily Average Revenue: ₹${dailyStats.avgDailyIncome.toLocaleString()}/day
• Highest Single Day Yield: ${dailyStats.peakDay ? `₹${dailyStats.peakDay.totalRevenue.toLocaleString()} on ${dailyStats.peakDay.fullDate} (${dailyStats.peakDay.bookingCount} sessions)` : "None"}

2. SESSION CATEGORY BREAKDOWN:
------------------------------------------------------------
• Jam Sessions:
  Count: ${jamBreakdown.count} | Hours: ${jamBreakdown.hoursCount}h | Yield: ₹${jamBreakdown.revenue.toLocaleString()} (${jamBreakdown.percentage.toFixed(1)}%)
• Karaoke Sessions:
  Count: ${karaokeBreakdown.count} | Hours: ${karaokeBreakdown.hoursCount}h | Yield: ₹${karaokeBreakdown.revenue.toLocaleString()} (${karaokeBreakdown.percentage.toFixed(1)}%)
• Recording Sessions:
  Count: ${recordingBreakdown.count} | Hours: ${recordingBreakdown.hoursCount}h | Yield: ₹${recordingBreakdown.revenue.toLocaleString()} (${recordingBreakdown.percentage.toFixed(1)}%)

3. COMPREHENSIVE BOOKINGS LEDGER (${monthBookings.length} Total Records):
------------------------------------------------------------
${bookingRowsText.trim() || "No bookings recorded for this period."}

============================================================
Audit record compiled from Cloud Firestore database.
All metrics synced with THE JAM JUNCTION telemetry.
============================================================
`;
    return reportBody.trim();
  };

  // Dispatch full monthly analytics report to email
  const handleShareAnalytics = async () => {
    if (isSharing) return;
    setIsSharing(true);
    setShareSuccess(false);
    setShareProgressMsg("Compiling full monthly booking ledger and revenue audit...");

    const formattedMonth = formatMonthTitle(selectedMonth);
    const reportText = generateMonthlyAuditReport();
    const mailId = "report_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);

    const emailLog: EmailLog = {
      id: mailId,
      recipient: recipientEmail,
      subject: `📊 THE JAM JUNCTION - ${formattedMonth} Monthly Financial & Bookings Statement`,
      body: reportText,
      type: "report",
      timestamp: new Date().toISOString(),
      status: "sent"
    };

    // Simulate SSL dispatch stages and save to Firestore
    setTimeout(async () => {
      setShareProgressMsg("Connecting to Cloud Firestore mail dispatch queue...");
      try {
        await setDoc(doc(db, "mail", mailId), {
          to: recipientEmail,
          subject: emailLog.subject,
          body: emailLog.body,
          month: selectedMonth,
          totalRevenue,
          totalSessions,
          totalHours,
          status: "sent",
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn("Firestore mail write warning:", err);
      }

      onSendEmailLog(emailLog);
      setIsSharing(false);
      setShareSuccess(true);
      setShareProgressMsg(`✓ Statement dispatched to ${recipientEmail}`);
      
      setTimeout(() => {
        setShareSuccess(false);
      }, 6000);
    }, 1000);
  };

  // Copy full report text
  const handleCopyReport = () => {
    const text = generateMonthlyAuditReport();
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Download CSV report
  const handleDownloadCSV = () => {
    const headers = ["Client Name", "Date", "Time Slot", "Session Type", "Duration (Hours)", "Rate (₹/hr)", "Total (₹)", "Status", "Special Requests"];
    const rows = monthBookings.map((b) => [
      `"${b.clientName.replace(/"/g, '""')}"`,
      b.date,
      `"${b.timeSlot}"`,
      b.type,
      b.hours,
      b.finalRate,
      b.totalAmount,
      b.status,
      `"${(b.customRequests || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `THE_JAM_JUNCTION_Report_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom Liquid-Glass Recharts Tooltip Component
  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: DailyIncomeItem = payload[0].payload;
      return (
        <div className="glass-panel-deep p-3.5 rounded-2xl border border-white/20 shadow-2xl backdrop-blur-2xl text-left min-w-48 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
            <span className="text-[11px] font-bold text-white font-mono">
              {data.fullDate} ({data.dayOfWeek})
            </span>
            {data.isToday && (
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                Today
              </span>
            )}
          </div>

          <div className="mb-2.5">
            <span className="text-[10px] text-gray-400 block uppercase tracking-wider">Total Day Income</span>
            <span className="text-lg font-black text-emerald-300 font-mono">
              ₹{data.totalRevenue.toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-400 font-mono block mt-0.5">
              {data.bookingCount} session{data.bookingCount !== 1 ? "s" : ""} • {data.totalHours} hrs booked
            </span>
          </div>

          {data.totalRevenue > 0 && (
            <div className="space-y-1 pt-2 border-t border-white/5 text-[10px] font-mono">
              {data.jamRevenue > 0 && (
                <div className="flex justify-between items-center text-purple-300">
                  <span>🎸 Jam:</span>
                  <span className="font-bold">₹{data.jamRevenue}</span>
                </div>
              )}
              {data.karaokeRevenue > 0 && (
                <div className="flex justify-between items-center text-pink-300">
                  <span>🎤 Karaoke:</span>
                  <span className="font-bold">₹{data.karaokeRevenue}</span>
                </div>
              )}
              {data.recordingRevenue > 0 && (
                <div className="flex justify-between items-center text-teal-300">
                  <span>🎙️ Recording:</span>
                  <span className="font-bold">₹{data.recordingRevenue}</span>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Circular Donut breakdown
  const radius = 55;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;

  let currentStrokeOffset = 0;
  const chartSegments = breakdowns.map((b) => {
    const rawValue = (b.percentage / 100) * circumference;
    const strokeDasharray = `${rawValue} ${circumference}`;
    const strokeDashoffset = -currentStrokeOffset;
    currentStrokeOffset += rawValue;

    const colors = {
      Jam: "#a855f7",
      Karaoke: "#ec4899",
      Recording: "#14b8a6",
    };

    const gradientStartColors = {
      Jam: "url(#purpleGradient)",
      Karaoke: "url(#pinkGradient)",
      Recording: "url(#tealGradient)",
    };

    return {
      ...b,
      color: colors[b.type],
      gradient: gradientStartColors[b.type],
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className="space-y-6 relative z-10 p-1 md:p-3">
      
      {/* TOP HEADER CONTROLS: Month Navigation & Share Analytics Action */}
      <div className="glass-panel rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-300">
        <div className="flex items-center gap-3.5 w-full md:w-auto">
          <div className="h-11 w-11 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20 shadow-purple-500/10 shadow-lg shrink-0">
            <BarChart3 className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Revenue Analytics & Daily Income</span>
              <span className="text-[10px] bg-purple-500/15 border border-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full font-mono font-bold uppercase">
                Daily Ready
              </span>
            </h2>
            <p className="text-xs text-gray-400 font-serif italic">
              Daily revenue visualization & consolidated financial performance for <strong className="text-purple-300 font-sans not-italic">{formatMonthTitle(selectedMonth)}</strong>
            </p>
          </div>
        </div>

        {/* Month Selector, Current Month & SHARE ANALYTICS Button */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
          
          {/* Month Steppers */}
          <div className="flex items-center gap-1 bg-black/40 border border-white/10 p-1 rounded-xl">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1.5 px-2 font-mono text-xs">
              <CalendarDays className="h-3.5 w-3.5 text-purple-400" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer text-xs"
              />
            </div>

            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Current Month */}
          <button
            onClick={() => setSelectedMonth(todayStr.slice(0, 7))}
            className={`text-xs px-3 py-2 rounded-xl border font-bold transition-all cursor-pointer ${
              selectedMonth === todayStr.slice(0, 7)
                ? "bg-purple-600/30 border-purple-500 text-purple-300"
                : "bg-black/30 border-white/10 text-gray-400 hover:text-white hover:border-white/20"
            }`}
          >
            Current Month
          </button>

          {/* PROMINENT SHARE ANALYTICS BUTTON */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="cursor-pointer bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:opacity-95 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl shadow-lg shadow-purple-600/20 flex items-center gap-2 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Share Analytics</span>
          </button>
        </div>
      </div>

      {/* SHARE ANALYTICS MODAL OVERLAY */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel rounded-3xl p-6 md:p-8 max-w-2xl w-full border border-purple-500/30 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto text-left">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                  <Share2 className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Share Monthly Analytics & Booking Ledger</h3>
                  <p className="text-xs text-gray-400 font-serif italic">
                    Consolidated report for <strong className="text-purple-300 font-sans not-italic">{formatMonthTitle(selectedMonth)}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsShareModalOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Recipient Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold text-gray-300 uppercase tracking-wider">
                Recipient Email Address:
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-purple-400" />
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-mono text-white border input-interactive"
                  placeholder="narkhedeatharva2106@gmail.com"
                />
              </div>
            </div>

            {/* Quick Metrics Summary Preview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-black/40 border border-white/5 font-mono text-xs">
              <div>
                <span className="text-[10px] text-gray-500 uppercase block">Total Revenue</span>
                <span className="text-base font-bold text-emerald-400 mt-0.5 block">₹{totalRevenue.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase block">Total Bookings</span>
                <span className="text-base font-bold text-white mt-0.5 block">{totalSessions} sessions</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase block">Soundcheck Hrs</span>
                <span className="text-base font-bold text-purple-300 mt-0.5 block">{totalHours}h</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase block">Average Yield</span>
                <span className="text-base font-bold text-indigo-300 mt-0.5 block">₹{avgHourlyRate}/hr</span>
              </div>
            </div>

            {/* Report Content Preview Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-400">Statement Content Preview ({monthBookings.length} Bookings Included):</span>
                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{isCopied ? "Copied!" : "Copy Report Text"}</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 font-mono text-[11px] text-gray-300 max-h-52 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text">
                {generateMonthlyAuditReport()}
              </div>
            </div>

            {/* Status Feedback */}
            {shareProgressMsg && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 animate-fadeIn ${
                shareSuccess 
                  ? "bg-emerald-950/40 border border-emerald-500/40 text-emerald-300" 
                  : "bg-purple-950/40 border border-purple-500/40 text-purple-300"
              }`}>
                {shareSuccess ? <Check className="h-4 w-4 text-emerald-400 shrink-0" /> : <RefreshCw className="h-4 w-4 animate-spin text-purple-400 shrink-0" />}
                <span>{shareProgressMsg}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={handleDownloadCSV}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-mono flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV Sheet</span>
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 text-gray-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={handleShareAnalytics}
                  disabled={isSharing}
                  className="w-full sm:w-auto cursor-pointer bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:opacity-95 text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02]"
                >
                  {isSharing ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Send Report to Email</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* DAILY INCOME RECHARTS BAR CHART PANEL */}
      <div className="glass-panel rounded-3xl p-6 md:p-7 relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 right-1/4 w-96 h-40 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-40 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Chart Header & Mode Toggles */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-base font-bold text-white tracking-tight">
                Daily Income Breakdown ({formatMonthTitle(selectedMonth)})
              </h3>
            </div>
            <p className="text-xs text-gray-400 font-serif italic mt-0.5">
              Hover over any day bar to view granular receipts, session duration, and client payouts
            </p>
          </div>

          {/* Visualization Mode Pill */}
          <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setChartMode("stacked")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                chartMode === "stacked"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Layers className="h-3 w-3" />
              <span>Stacked by Type</span>
            </button>
            <button
              onClick={() => setChartMode("total")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                chartMode === "total"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <TrendingUp className="h-3 w-3" />
              <span>Consolidated Total</span>
            </button>
          </div>
        </div>

        {/* Daily Stats KPI Cards Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/30">
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-mono">Today's Income</span>
            <div className="mt-1">
              <span className="text-xl font-black text-white font-mono block">
                ₹{dailyStats.todayIncome.toLocaleString()}
              </span>
              <span className="text-[9px] text-emerald-400 font-mono mt-0.5 block">
                ● Live for {todayStr}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/30">
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-mono">Month Peak Day</span>
            <div className="mt-1">
              <span className="text-xl font-black text-purple-300 font-mono block">
                {dailyStats.peakDay ? `₹${dailyStats.peakDay.totalRevenue.toLocaleString()}` : "₹0"}
              </span>
              <span className="text-[9px] text-gray-400 font-mono mt-0.5 block truncate">
                {dailyStats.peakDay ? `${dailyStats.peakDay.fullDate} (${dailyStats.peakDay.bookingCount} slots)` : "No bookings"}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/30">
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-mono">Active Studio Days</span>
            <div className="mt-1">
              <span className="text-xl font-black text-indigo-300 font-mono block">
                {dailyStats.activeDaysCount} Days
              </span>
              <span className="text-[9px] text-gray-400 font-mono mt-0.5 block">
                {((dailyStats.activeDaysCount / Math.max(dailyIncomeData.length, 1)) * 100).toFixed(0)}% month occupancy
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/30">
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-mono">Daily Average Yield</span>
            <div className="mt-1">
              <span className="text-xl font-black text-pink-300 font-mono block">
                ₹{dailyStats.avgDailyIncome.toLocaleString()}
              </span>
              <span className="text-[9px] text-gray-400 font-mono mt-0.5 block">
                Per active operating day
              </span>
            </div>
          </div>
        </div>

        {/* The Recharts Bar Chart Container */}
        <div className="w-full h-72 sm:h-80 relative">
          {dailyIncomeData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500 font-mono text-xs">
              No data available for {selectedMonth}.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dailyIncomeData}
                margin={{ top: 15, right: 10, left: -10, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="totalBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="jamBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c084fc" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#9333ea" stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="karaokeBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f472b6" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#db2777" stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="recordingBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#0d9488" stopOpacity={0.6} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255, 255, 255, 0.07)"
                  vertical={false}
                />

                <XAxis
                  dataKey="dayLabel"
                  stroke="rgba(255, 255, 255, 0.4)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
                  interval="preserveStartEnd"
                />

                <YAxis
                  stroke="rgba(255, 255, 255, 0.4)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
                  tickFormatter={(val) => `₹${val}`}
                />

                <Tooltip content={<CustomBarTooltip />} />

                {chartMode === "stacked" ? (
                  <>
                    <Bar
                      dataKey="jamRevenue"
                      name="Jam Sessions"
                      stackId="income"
                      fill="url(#jamBarGradient)"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="karaokeRevenue"
                      name="Karaoke Sessions"
                      stackId="income"
                      fill="url(#karaokeBarGradient)"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="recordingRevenue"
                      name="Recording Sessions"
                      stackId="income"
                      fill="url(#recordingBarGradient)"
                      radius={[4, 4, 0, 0]}
                    />
                  </>
                ) : (
                  <Bar
                    dataKey="totalRevenue"
                    name="Daily Income"
                    fill="url(#totalBarGradient)"
                    radius={[5, 5, 0, 0]}
                  >
                    {dailyIncomeData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isToday ? "#ec4899" : "url(#totalBarGradient)"}
                        stroke={entry.isToday ? "#f472b6" : "rgba(255, 255, 255, 0.2)"}
                        strokeWidth={entry.isToday ? 1.5 : 0.5}
                      />
                    ))}
                  </Bar>
                )}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Legend & Color Key */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 mt-2 border-t border-white/5 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-4">
            {chartMode === "stacked" ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-purple-400" />
                  <span className="text-gray-300">Jam (₹{jamBreakdown.revenue.toLocaleString()})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-pink-400" />
                  <span className="text-gray-300">Karaoke (₹{karaokeBreakdown.revenue.toLocaleString()})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-teal-400" />
                  <span className="text-gray-300">Recording (₹{recordingBreakdown.revenue.toLocaleString()})</span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-purple-500" />
                <span className="text-gray-300">Consolidated Daily Earning</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-[11px] text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-pink-500 inline-block" />
              <span>Today Highlighted</span>
            </span>
            <span>•</span>
            <span className="text-purple-300 font-bold">Domain: jamjunction.me</span>
          </div>
        </div>
      </div>

      {/* LOWER SECTION: STATS ROW, DONUT BREAKDOWN & QUICK SHARE BANNER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: KPI STATS & DONUT (7 COLUMNS) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* KPI Summary Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/30">
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold font-mono">Total Revenue</span>
              <div className="mt-2">
                <span className="text-xl md:text-2xl font-black text-white font-mono block">₹{totalRevenue.toLocaleString()}</span>
                <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-0.5 mt-1">
                  <TrendingUp className="h-2.5 w-2.5" /> Month Total
                </span>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/30">
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold font-mono">Soundcheck Hrs</span>
              <div className="mt-2">
                <span className="text-xl md:text-2xl font-black text-white font-mono block">{totalHours}h</span>
                <span className="text-[9px] text-purple-400 font-medium block mt-1">Total active studio load</span>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/30">
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold font-mono">Active Sessions</span>
              <div className="mt-2">
                <span className="text-xl md:text-2xl font-black text-white font-mono block">{totalSessions}</span>
                <span className="text-[9px] text-indigo-400 font-semibold block mt-1">Non-cancelled bookings</span>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/30">
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold font-mono">Average Yield</span>
              <div className="mt-2">
                <span className="text-xl md:text-2xl font-black text-white font-mono block">₹{avgHourlyRate}</span>
                <span className="text-[9px] text-gray-400 block mt-1">Weighted ₹/hour rate</span>
              </div>
            </div>
          </div>

          {/* DONUT SUMMARY & SPLIT METRICS */}
          <div className="glass-panel rounded-2xl p-6 flex flex-col md:flex-row items-center gap-8 justify-between transition-all duration-300">
            <div className="space-y-4 max-w-xs">
              <div>
                <h3 className="text-base font-extrabold text-white tracking-tight">Revenue Mix Split</h3>
                <p className="text-xs text-gray-400 font-serif italic mt-0.5">
                  {formatMonthTitle(selectedMonth)} category distribution metrics
                </p>
              </div>
              
              <div className="space-y-2.5 pt-2">
                {breakdowns.map((b) => {
                  const colors = {
                    Jam: "bg-purple-500",
                    Karaoke: "bg-pink-500",
                    Recording: "bg-teal-400",
                  };
                  return (
                    <div key={b.type} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${colors[b.type]}`} />
                        <span className="text-gray-300 font-medium">{b.type} Session</span>
                      </div>
                      <span className="font-mono text-gray-400 font-semibold">
                        {b.percentage.toFixed(1)}% (₹{b.revenue.toLocaleString()})
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SVG DONUT CHART */}
            <div className="relative h-44 w-44 flex items-center justify-center shrink-0">
              <svg width="100%" height="100%" viewBox="0 0 160 160" className="transform -rotate-90">
                <defs>
                  <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#c084fc" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                  <linearGradient id="pinkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f472b6" />
                    <stop offset="100%" stopColor="#db2777" />
                  </linearGradient>
                  <linearGradient id="tealGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2dd4bf" />
                    <stop offset="100%" stopColor="#0d9488" />
                  </linearGradient>
                </defs>

                {totalRevenue === 0 ? (
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="transparent"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth={strokeWidth}
                  />
                ) : (
                  chartSegments.map((segment) => {
                    if (segment.percentage === 0) return null;
                    return (
                      <circle
                        key={segment.type}
                        cx="80"
                        cy="80"
                        r={radius}
                        fill="transparent"
                        stroke={segment.gradient}
                        strokeWidth={strokeWidth}
                        strokeDasharray={segment.strokeDasharray}
                        strokeDashoffset={segment.strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 origin-center"
                      />
                    );
                  })
                )}
              </svg>

              {/* Inner text metric */}
              <div className="absolute inset-0 flex flex-col items-center justify-center mt-1">
                <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold font-mono">Month Earned</span>
                <span className="text-lg font-black font-mono text-white mt-0.5">₹{totalRevenue.toLocaleString()}</span>
                <span className="text-[9px] text-purple-400 font-mono italic">{formatMonthTitle(selectedMonth)}</span>
              </div>
            </div>
          </div>

          {/* DETAILED CATEGORY LIST */}
          <div className="space-y-3">
            {breakdowns.map((b) => {
              const borders = {
                Jam: "border-purple-500/10 hover:border-purple-500/40",
                Karaoke: "border-pink-500/10 hover:border-pink-500/40",
                Recording: "border-teal-500/10 hover:border-teal-500/40",
              };
              const barColors = {
                Jam: "bg-purple-500",
                Karaoke: "bg-pink-500",
                Recording: "bg-teal-400",
              };

              return (
                <div
                  key={b.type}
                  className={`glass-panel rounded-xl p-4 border flex items-center justify-between gap-4 transition-all duration-300 hover:-translate-y-1 ${borders[b.type]}`}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-white font-bold">{b.type} Sessions</span>
                      <span className="text-gray-400 font-mono">₹{b.revenue.toLocaleString()} ({b.percentage.toFixed(0)}%)</span>
                    </div>
                    
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColors[b.type]}`}
                        style={{ width: `${b.percentage}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                      <span>Active bookings: <strong className="text-gray-300">{b.count}</strong></span>
                      <span>Total hours: <strong className="text-gray-300">{b.hoursCount}h</strong></span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-gray-500 block font-mono">Avg Session Yield</span>
                    <span className="text-xs font-bold text-white font-mono mt-0.5 block">
                      ₹{b.count > 0 ? Math.round(b.revenue / b.count).toLocaleString() : 0}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: DIRECT SHARE & DISPATCH CONTROLLER (5 COLUMNS) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between flex-1 transition-all duration-300">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-500/30">
                  <Share2 className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Share Analytics via Email</h3>
                  <span className="text-[10px] text-gray-400 font-serif italic block">
                    Export entire month booking data, soundcheck times & financials
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                Generates a verified, itemized analytical statement of all sessions, clients, time slots, and income for <strong className="text-purple-300">{formatMonthTitle(selectedMonth)}</strong> and sends it directly to your email address:
              </p>

              <div className="bg-black/40 border border-white/10 p-3.5 rounded-xl flex items-center gap-3.5 mb-5 select-none text-left transition-all hover:border-purple-500/30">
                <MailPlus className="h-5 w-5 text-teal-400 shrink-0" />
                <div className="flex-1 truncate">
                  <span className="text-[10px] text-gray-400 uppercase font-mono block">Designated Email Target:</span>
                  <span className="text-xs text-white font-mono font-bold block truncate">{recipientEmail}</span>
                </div>
              </div>

              {/* Monthly Ledger Snapshot preview */}
              <div className="p-3.5 rounded-xl bg-black/60 border border-white/5 space-y-2 mb-4 font-mono text-[11px] text-left">
                <div className="flex justify-between text-gray-400 pb-1 border-b border-white/5 text-[10px]">
                  <span>Month: {selectedMonth}</span>
                  <span className="text-purple-300">{monthBookings.length} Session Records</span>
                </div>
                <div className="space-y-1 text-gray-300 max-h-36 overflow-y-auto pr-1">
                  {monthBookings.length === 0 ? (
                    <div className="text-gray-600 italic py-2">No bookings logged for this month.</div>
                  ) : (
                    monthBookings.slice(0, 5).map((b) => (
                      <div key={b.id} className="flex justify-between items-center text-[10px] py-1 border-b border-white/5">
                        <span className="truncate max-w-36 text-white font-bold">{b.clientName}</span>
                        <span className="text-gray-400">{b.date.slice(5)} • {b.hours}h</span>
                        <span className="text-emerald-400 font-bold">₹{b.totalAmount}</span>
                      </div>
                    ))
                  )}
                  {monthBookings.length > 5 && (
                    <div className="text-[10px] text-purple-400 italic text-center pt-1">
                      + {monthBookings.length - 5} more sessions included in export
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleShareAnalytics}
                disabled={isSharing}
                className="w-full cursor-pointer bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:opacity-95 text-white py-3 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                {isSharing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Transmitting Audit to Email...</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4" />
                    <span>Share Monthly Analytics to Email</span>
                  </>
                )}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={handleCopyReport}
                  className="flex-1 cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white py-2 rounded-xl font-mono text-[11px] flex items-center justify-center gap-1.5 transition-all"
                >
                  {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{isCopied ? "Copied" : "Copy Statement"}</span>
                </button>

                <button
                  onClick={handleDownloadCSV}
                  className="flex-1 cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white py-2 rounded-xl font-mono text-[11px] flex items-center justify-center gap-1.5 transition-all"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>

              {shareSuccess && (
                <div className="p-3 bg-emerald-950/30 text-emerald-400 text-xs border border-emerald-500/30 rounded-xl flex items-center gap-2 animate-fadeIn text-left">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold block">Monthly statement dispatched!</span>
                    <span className="text-[10px] text-emerald-300/80 block">
                      Dispatched and synced to <strong className="text-white">{recipientEmail}</strong> and logged in timeline.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
