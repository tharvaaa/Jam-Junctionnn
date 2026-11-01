/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Booking, StudioNote, EmailLog, BookingStatus } from "./types";
import { SEED_NOTES } from "./data";
import InteractiveBackground from "./components/InteractiveBackground";
import BookingEntry from "./components/BookingEntry";
import DailySchedule from "./components/DailySchedule";
import RevenueAnalytics from "./components/RevenueAnalytics";
import StudioNotes from "./components/StudioNotes";
import LogTimeline from "./components/LogTimeline";
import { 
  db, 
  testConnection, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  handleFirestoreError, 
  OperationType,
  ADMIN_EMAIL
} from "./firebase";

import { 
  Calendar, Sliders, DollarSign, BookOpen, 
  Mail, ShieldCheck, Clock
} from "lucide-react";

export default function App() {
  const supervisorEmail = ADMIN_EMAIL;
  
  // App persistent state from Cloud Firestore
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notes, setNotes] = useState<StudioNote[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [isDbConnected, setIsDbConnected] = useState(false);
  
  // Navigation tabs (Added "timeline" tab, removed supervisor tab from header)
  const [activeTab, setActiveTab] = useState<"entry" | "schedule" | "revenue" | "timeline" | "notes">("entry");
  
  const [currentTime, setCurrentTime] = useState<string>("");

  // Toast notification feedback
  const [activeToast, setActiveToast] = useState<{ id: string; message: string; type: "success" | "info" } | null>(null);

  // 1. Initial Connection Test & Live Clock
  useEffect(() => {
    testConnection().then((connected) => {
      setIsDbConnected(connected);
    });

    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", { hour12: true }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);

    return () => clearInterval(timer);
  }, []);

  // 2. Real-Time Cloud Firestore Sync for Bookings, Studio Notes, and Mail
  useEffect(() => {
    // A. Real-time Firestore Listener: bookings
    // A. Real-time Firestore Listener: bookings (Purging test band names and never re-seeding)
    const bookingsPath = "bookings";
    const testIds = new Set(["b1", "b2", "b3", "b4", "b5", "b6", "b7"]);
    const testBandKeywords = [
      "paranoid sunsets", "symphony of echoes", "riya & friends",
      "velvet anthems", "sublime resonance", "late night beats", "jazz fusion"
    ];

    const unsubscribeBookings = onSnapshot(
      collection(db, bookingsPath),
      async (snapshot) => {
        if (snapshot.empty) {
          setBookings([]);
        } else {
          const loaded: Booking[] = [];
          for (const docSnap of snapshot.docs) {
            const data = docSnap.data() as Booking;
            const isTest = 
              testIds.has(docSnap.id) || 
              (data.clientName && testBandKeywords.some(kw => data.clientName.toLowerCase().includes(kw)));
            
            if (isTest) {
              // Automatically purge existing test band documents from Cloud Firestore
              deleteDoc(doc(db, bookingsPath, docSnap.id)).catch(() => {});
            } else {
              loaded.push(data);
            }
          }
          loaded.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
          setBookings(loaded);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, bookingsPath);
      }
    );

    // B. Real-time Firestore Listener: studio_notes
    const notesPath = "studio_notes";
    const unsubscribeNotes = onSnapshot(
      collection(db, notesPath),
      async (snapshot) => {
        if (snapshot.empty) {
          const defaultNotes = SEED_NOTES || [];
          for (const n of defaultNotes) {
            try {
              await setDoc(doc(db, notesPath, n.id), n);
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, notesPath);
            }
          }
          setNotes(defaultNotes);
        } else {
          const loadedNotes: StudioNote[] = [];
          snapshot.forEach((docSnap) => {
            loadedNotes.push(docSnap.data() as StudioNote);
          });
          loadedNotes.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
          setNotes(loadedNotes);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, notesPath);
      }
    );

    // C. Real-time Firestore Listener: mail (Purging test dummy logs and never re-seeding)
    const mailPath = "mail";
    const unsubscribeMail = onSnapshot(
      collection(db, mailPath),
      (snapshot) => {
        const loadedLogs: EmailLog[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const isTest = 
            docSnap.id.startsWith("e_init_") || 
            (data.clientName && testBandKeywords.some(kw => data.clientName.toLowerCase().includes(kw))) ||
            (data.subject && testBandKeywords.some(kw => data.subject.toLowerCase().includes(kw)));

          if (isTest) {
            deleteDoc(doc(db, mailPath, docSnap.id)).catch(() => {});
          } else {
            loadedLogs.push({
              id: docSnap.id,
              recipient: data.to || ADMIN_EMAIL,
              clientName: data.clientName || undefined,
              subject: data.subject || "JAM JUNCTION Notification",
              body: data.body || "",
              type: data.subject?.includes("Analytics") || data.subject?.includes("Statement") ? "report" : 
                    data.subject?.includes("Reminder") || data.subject?.includes("Alert") ? "reminder" : "confirmation",
              timestamp: data.createdAt || new Date().toISOString(),
              status: data.status === "failed" ? "failed" : "sent",
              bookingId: data.bookingId,
              hours: data.hours,
              totalAmount: data.totalAmount
            });
          }
        });

        loadedLogs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        setEmailLogs(loadedLogs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, mailPath);
      }
    );

    return () => {
      unsubscribeBookings();
      unsubscribeNotes();
      unsubscribeMail();
    };
  }, []);

  // Sync state helpers connected to Cloud Firestore
  const handleAddBooking = async (newBooking: Booking) => {
    const bookingsPath = "bookings";
    const mailPath = "mail";
    try {
      // 1. Immediately update bookings state so UI reflects it synchronously in schedule/revenue
      setBookings((prev) => [newBooking, ...prev.filter((b) => b.id !== newBooking.id)]);

      await setDoc(doc(db, bookingsPath, newBooking.id), newBooking);

      // Trigger automatic booking confirmation email and dispatch log alert to narkhedeatharva2106@gmail.com
      const clientEmail = `${newBooking.clientName.trim().replace(/\s+/g, "").toLowerCase()}@gmail.com`;
      const mailId = "mail_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);

      const emailPayload = {
        to: clientEmail,
        adminAlertTo: ADMIN_EMAIL,
        clientName: newBooking.clientName,
        subject: `🎸 ${newBooking.clientName} — Booking Locked (${newBooking.type}, ${newBooking.hours} hrs @ ₹${newBooking.finalRate}/hr)`,
        body: `Hi ${newBooking.clientName},\n\nYour session has been successfully reserved and locked into JAM JUNCTION Studio Schedule!\n\nClient / Band Name: ${newBooking.clientName}\n📅 Date: ${newBooking.date}\n⏱️ Duration: ${newBooking.hours} Hour${newBooking.hours !== 1 ? "s" : ""}\n🎸 Session Type: ${newBooking.type} Session (@ ₹${newBooking.finalRate}/hr)\n🎧 Total Bill: ₹${newBooking.totalAmount}\n📝 Requests: ${newBooking.customRequests || "None"}\n\n[DISPATCH AUDIT ALERT]\nAuto-dispatched and logged for studio supervisor: ${ADMIN_EMAIL}`,
        bookingId: newBooking.id,
        hours: newBooking.hours,
        totalAmount: newBooking.totalAmount,
        status: "sent",
        createdAt: new Date().toISOString()
      };

      // 2. Immediately update local email logs state so timeline shows it with the client name right away
      const newEmailLog: EmailLog = {
        id: mailId,
        recipient: clientEmail,
        clientName: newBooking.clientName,
        subject: emailPayload.subject,
        body: emailPayload.body,
        type: "confirmation",
        timestamp: emailPayload.createdAt,
        status: "sent",
        bookingId: newBooking.id,
        hours: newBooking.hours,
        totalAmount: newBooking.totalAmount
      };
      setEmailLogs((prev) => [newEmailLog, ...prev.filter((l) => l.id !== mailId)]);

      await setDoc(doc(db, mailPath, mailId), emailPayload);
      showToast(`✓ Booking for "${newBooking.clientName}" locked and timeline updated!`, "success");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, bookingsPath);
    }
  };

  const handleUpdateBookingStatus = async (id: string, newStatus: BookingStatus) => {
    const bookingsPath = "bookings";
    try {
      await updateDoc(doc(db, bookingsPath, id), { status: newStatus });
      const client = bookings.find(b => b.id === id);
      showToast(`Status updated in Firestore to: ${newStatus} for ${client?.clientName || "session"}.`, "info");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, bookingsPath);
    }
  };

  const handleDeleteBooking = async (id: string) => {
    const bookingsPath = "bookings";
    try {
      await deleteDoc(doc(db, bookingsPath, id));
      showToast("Booking permanently removed from Cloud Firestore.", "info");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, bookingsPath);
    }
  };

  const handleClearAllBookings = async () => {
    const bookingsPath = "bookings";
    try {
      for (const b of bookings) {
        await deleteDoc(doc(db, bookingsPath, b.id)).catch(() => {});
      }
      setBookings([]);
      localStorage.removeItem("jam_junction_bookings");
      showToast("All scheduled sessions cleared.", "info");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, bookingsPath);
    }
  };

  const handleClearAllLogs = async () => {
    const mailPath = "mail";
    try {
      for (const l of emailLogs) {
        await deleteDoc(doc(db, mailPath, l.id)).catch(() => {});
      }
      setEmailLogs([]);
      showToast("All dispatch & email logs cleared.", "info");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, mailPath);
    }
  };

  const handleAddNote = async (newNote: StudioNote) => {
    const notesPath = "studio_notes";
    try {
      await setDoc(doc(db, notesPath, newNote.id), newNote);
      showToast("✓ Scratchpad memo synced to Cloud Firestore.", "success");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, notesPath);
    }
  };

  const handleDeleteNote = async (id: string) => {
    const notesPath = "studio_notes";
    try {
      await deleteDoc(doc(db, notesPath, id));
      showToast("Memo removed from Cloud Firestore.", "info");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, notesPath);
    }
  };

  const handleUpdateNote = async (updatedNote: StudioNote) => {
    const notesPath = "studio_notes";
    try {
      await setDoc(doc(db, notesPath, updatedNote.id), updatedNote);
      showToast("Changes synced to Cloud Firestore across all devices.", "info");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, notesPath);
    }
  };

  const handleSendEmailLog = async (log: EmailLog) => {
    setEmailLogs(current => [log, ...current]);
    try {
      await setDoc(doc(db, "mail", log.id), {
        to: log.recipient,
        subject: log.subject,
        body: log.body,
        status: log.status,
        createdAt: log.timestamp
      });
    } catch (err) {
      console.warn("Mail write error:", err);
    }
    showToast(`📬 Dispatch alert delivered to ${log.recipient}`, "success");
  };

  const showToast = (message: string, type: "success" | "info" = "success") => {
    const id = Math.random().toString();
    setActiveToast({ id, message, type });
    setTimeout(() => {
      setActiveToast((current) => current?.id === id ? null : current);
    }, 4500);
  };

  return (
    <div className="min-h-screen text-[#F5F5F7] bg-[#0A0A0A] relative overflow-x-hidden font-sans selection:bg-purple-500/30 selection:text-white pb-32">
      
      {/* Dynamic drifting canvas behind the glass cards */}
      <InteractiveBackground />

      {/* FLOATING ACTION TOAST BOX */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl glass-popup shadow-xl pointer-events-auto border border-purple-500/40 flex items-center gap-3 animate-fadeIn max-w-sm">
          <div className="h-2 w-2 rounded-full bg-purple-500 animate-ping" />
          <p className="text-xs text-white font-semibold">{activeToast.message}</p>
        </div>
      )}

      {/* TOP MASTER LEVEL HEADER (Centered bold single-color JAM JUNCTION brand title) */}
      <header className="sticky top-0 z-40 bg-black/45 backdrop-filter backdrop-blur-md border-b border-white/5 px-4 md:px-8 py-5 pointer-events-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Left subtle indicator */}
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-gray-400 w-48 shrink-0">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-gray-300">Live Studio Engine</span>
          </div>

          {/* Centered Large Bold Single Color Brand Title (Music-Oriented Font, Solid White) */}
          <div className="text-center flex-1 flex flex-col items-center justify-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-widest text-white select-none drop-shadow-md font-sans">
              JAM JUNCTION
            </h1>
          </div>

          {/* Right Live Clock & Dispatch shortcut */}
          <div className="flex items-center gap-2.5 justify-center md:justify-end text-xs font-mono w-full md:w-48 shrink-0">
            <div className="bg-[#121212]/80 border border-white/10 py-1.5 px-3 rounded-xl flex items-center gap-2 text-left">
              <Clock className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-white font-mono text-xs font-bold">{currentTime || "Live"}</span>
            </div>

            <button
              onClick={() => setActiveTab("timeline")}
              className={`border px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer font-bold transition-all duration-300 ${
                activeTab === "timeline"
                  ? "bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-600/30"
                  : "bg-[#1C1C24]/90 hover:bg-purple-950/20 border-purple-500/25 text-purple-300 hover:text-white"
              }`}
              title="Go to Log Timeline"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Timeline</span>
              <span className="text-[10px] bg-purple-500/20 px-1.5 py-0.2 rounded-full font-mono">
                {emailLogs.length}
              </span>
            </button>
          </div>

        </div>
      </header>

      {/* CORE CONTENT BLOCK CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-8 space-y-8 relative z-10">
        
        {/* BRAND PROMOTIONS ACCENT */}
        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden pointer-events-auto transition-all duration-300">
          <div className="absolute top-0 right-0 w-80 h-40 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 text-purple-400 text-[10px] uppercase tracking-widest font-extrabold font-mono mb-1">
                <span className="bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  Direct Studio Console
                </span>
              </div>
              <h2 className="text-2xl font-black text-[#F5F5F7]">Studio Command & Dispatch Console</h2>
            </div>

            {/* Quick dashboard figures counters */}
            <div className="grid grid-cols-2 gap-4 w-full md:w-auto shrink-0 divide-x divide-white/5">
              <div className="pl-4">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Today's Sessions</span>
                <span className="text-xl font-bold font-mono text-purple-400">
                  {bookings.filter(b => b.date === "2026-05-26" && b.status !== "Cancelled").length} Active
                </span>
              </div>
              <div className="pl-4">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Dispatched Alerts</span>
                <span className="text-xl font-bold font-mono text-pink-400">
                  {emailLogs.length} Logs
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* INTERACTIVE NAVIGATION TABS: Command Center, Live Schedule, Revenue, Log Timeline, Scratchpad */}
        <div className="flex items-center bg-black/40 p-1.5 rounded-2xl border border-white/5 max-w-4xl pointer-events-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab("entry")}
            className={`flex-1 min-w-28 text-center font-bold text-xs uppercase py-3 rounded-xl transition duration-300 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "entry"
                ? "bg-gradient-to-r from-[#1E1E2E] to-purple-950/40 text-white border border-purple-500/40 shadow-inner shadow-purple-500/10"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Sliders className="h-4 w-4" />
            <span className="hidden sm:inline">Command Center</span>
            <span className="sm:hidden">Log</span>
          </button>

          <button
            onClick={() => setActiveTab("schedule")}
            className={`flex-1 min-w-28 text-center font-bold text-xs uppercase py-3 rounded-xl transition duration-300 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "schedule"
                ? "bg-gradient-to-r from-[#1E1E2E] to-purple-950/40 text-white border border-purple-500/40 shadow-inner"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Live Schedule</span>
            <span className="sm:hidden">Timeline</span>
          </button>

          <button
            onClick={() => setActiveTab("revenue")}
            className={`flex-1 min-w-28 text-center font-bold text-xs uppercase py-3 rounded-xl transition duration-300 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "revenue"
                ? "bg-gradient-to-r from-[#1E1E2E] to-purple-950/40 text-white border border-purple-500/40 shadow-inner"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Revenue Analytics</span>
            <span className="sm:hidden">Revenue</span>
          </button>

          {/* DEDICATED LOG TIMELINE TAB */}
          <button
            onClick={() => setActiveTab("timeline")}
            className={`flex-1 min-w-28 text-center font-bold text-xs uppercase py-3 rounded-xl transition duration-300 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "timeline"
                ? "bg-gradient-to-r from-[#1E1E2E] to-purple-950/40 text-white border border-purple-500/40 shadow-inner"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Log Timeline</span>
            <span className="sm:hidden">Logs</span>
          </button>

          <button
            onClick={() => setActiveTab("notes")}
            className={`flex-1 min-w-28 text-center font-bold text-xs uppercase py-3 rounded-xl transition duration-300 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "notes"
                ? "bg-gradient-to-r from-[#1E1E2E] to-purple-950/40 text-white border border-purple-500/40 shadow-inner"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Studio Scratchpad</span>
            <span className="sm:hidden">Notes</span>
          </button>
        </div>

        {/* RENDER ACTIVE TAB WITH REAL-TIME FIRESTORE DATA */}
        <div className="animate-fadeIn">
          {activeTab === "entry" && (
            <BookingEntry 
              onAddBooking={handleAddBooking} 
              onSendEmailLog={handleSendEmailLog}
              userEmail={supervisorEmail}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === "schedule" && (
            <DailySchedule 
              bookings={bookings}
              onUpdateBookingStatus={handleUpdateBookingStatus}
              onDeleteBooking={handleDeleteBooking}
              onClearAllBookings={handleClearAllBookings}
            />
          )}

          {activeTab === "revenue" && (
            <RevenueAnalytics 
              bookings={bookings}
              onSendEmailLog={handleSendEmailLog}
              userEmail={supervisorEmail}
            />
          )}

          {activeTab === "timeline" && (
            <LogTimeline 
              emailLogs={emailLogs}
              onSendEmailLog={handleSendEmailLog}
              supervisorEmail={supervisorEmail}
              onClearAllLogs={handleClearAllLogs}
            />
          )}

          {activeTab === "notes" && (
            <StudioNotes 
              notes={notes}
              onAddNote={handleAddNote}
              onDeleteNote={handleDeleteNote}
              onUpdateNote={handleUpdateNote}
            />
          )}
        </div>

      </main>

    </div>
  );
}
