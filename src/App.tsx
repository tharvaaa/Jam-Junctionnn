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
import LoginPage from "./components/LoginPage";
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
  Mail, ShieldCheck, Clock, Lock, LogOut
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

  // Authenticator state (Guarded with username: "The Jam Junction", password: "Nokia@12345")
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return (
      localStorage.getItem("jam_junction_auth") === "true" ||
      sessionStorage.getItem("jam_junction_auth") === "true"
    );
  });

  const handleLogout = () => {
    localStorage.removeItem("jam_junction_auth");
    sessionStorage.removeItem("jam_junction_auth");
    setIsAuthenticated(false);
  };

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
              phoneNumber: data.phoneNumber || undefined,
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
        phoneNumber: newBooking.phoneNumber || undefined,
        subject: `🎸 ${newBooking.clientName} — Booking Locked (${newBooking.type}, ${newBooking.hours} hrs @ ₹${newBooking.finalRate}/hr)`,
        body: `Hi ${newBooking.clientName},\n\nYour session has been successfully reserved and locked into JAM JUNCTION Studio Schedule!\n\nClient / Band Name: ${newBooking.clientName}\n${newBooking.phoneNumber ? `📞 Contact Phone: ${newBooking.phoneNumber}\n` : ""}📅 Date: ${newBooking.date}\n⏱️ Duration: ${newBooking.hours} Hour${newBooking.hours !== 1 ? "s" : ""}\n🎸 Session Type: ${newBooking.type} Session (@ ₹${newBooking.finalRate}/hr)\n🎧 Total Bill: ₹${newBooking.totalAmount}\n📝 Requests: ${newBooking.customRequests || "None"}\n\n[DISPATCH AUDIT ALERT]\nAuto-dispatched and logged for studio supervisor: ${ADMIN_EMAIL}`,
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
        phoneNumber: newBooking.phoneNumber || undefined,
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

  const handleUpdateBookingStatus = async (id: string, newStatus: BookingStatus, updates?: Partial<Booking>) => {
    const bookingsPath = "bookings";
    try {
      const existing = bookings.find(b => b.id === id);
      const updateData: Record<string, any> = { status: newStatus, ...(updates || {}) };
      
      // If moving to Live Now, record startedAt timestamp if not already present
      if (newStatus === "Live Now" && !existing?.startedAt) {
        updateData.startedAt = new Date().toISOString();
      }

      setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updateData } : b));
      await updateDoc(doc(db, bookingsPath, id), updateData);
      const client = bookings.find(b => b.id === id);
      showToast(`Status updated: ${newStatus} for ${client?.clientName || "session"}.`, "info");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, bookingsPath);
    }
  };

  const handleUpdateBooking = async (id: string, updates: Partial<Booking>) => {
    const bookingsPath = "bookings";
    try {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
      await updateDoc(doc(db, bookingsPath, id), updates);
      showToast("Booking updated in cloud.", "info");
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

  // Guard entire application behind Authenticator Gate
  if (!isAuthenticated) {
    return (
      <LoginPage 
        onLogin={() => {
          setIsAuthenticated(true);
          showToast("Authenticated successfully. Welcome to JAM JUNCTION.", "success");
        }} 
      />
    );
  }

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
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Centered Large Bold Single Color Brand Title (Music-Oriented Font, Solid White) */}
          <div className="flex-1 flex items-center justify-start sm:justify-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-widest text-white select-none drop-shadow-md font-sans">
              JAM JUNCTION
            </h1>
          </div>

          {/* Right Lock Console */}
          <div className="flex items-center gap-2 justify-end text-xs font-mono shrink-0">
            <button
              onClick={handleLogout}
              className="bg-[#1C1C24]/90 hover:bg-red-950/40 border border-white/10 hover:border-red-500/40 text-gray-300 hover:text-red-300 px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer font-bold transition-all duration-300"
              title="Lock studio console / Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Lock</span>
            </button>
          </div>

        </div>
      </header>

      {/* CORE CONTENT BLOCK CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-6 space-y-6 relative z-10">
        
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
              onUpdateBooking={handleUpdateBooking}
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
              bookings={bookings}
              onSendEmailLog={handleSendEmailLog}
              supervisorEmail={supervisorEmail}
              onClearAllLogs={handleClearAllLogs}
              onUpdateBookingStatus={handleUpdateBookingStatus}
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
