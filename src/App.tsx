/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Booking, StudioNote, EmailLog, BookingStatus } from "./types";
import { TIME_SLOTS, SEED_NOTES } from "./data";
import InteractiveBackground from "./components/InteractiveBackground";
import BookingEntry from "./components/BookingEntry";
import DailySchedule from "./components/DailySchedule";
import RevenueAnalytics from "./components/RevenueAnalytics";
import StudioNotes from "./components/StudioNotes";
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
  Terminal, Mail, ShieldCheck
} from "lucide-react";

export default function App() {
  const supervisorEmail = ADMIN_EMAIL;
  
  // App persistent state from Cloud Firestore
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notes, setNotes] = useState<StudioNote[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [isDbConnected, setIsDbConnected] = useState(false);
  
  // Navigation
  const [activeTab, setActiveTab] = useState<"entry" | "schedule" | "revenue" | "notes">("entry");
  
  // Logs drawer toggler
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");

  // Toast notification feedback
  const [activeToast, setActiveToast] = useState<{ id: string; message: string; type: "success" | "info" } | null>(null);

  // 1. Initial Connection Test & Live Clock
  useEffect(() => {
    // Validate connection to Firestore as mandated by Firebase architecture guidelines
    testConnection().then((connected) => {
      setIsDbConnected(connected);
    });

    // Live clock running using user's metadata time anchor
    const dateAnchor = new Date("2026-05-26T20:37:10Z");
    let secondsElapsed = 0;
    
    const timer = setInterval(() => {
      secondsElapsed++;
      const current = new Date(dateAnchor.getTime() + secondsElapsed * 1000);
      setCurrentTime(current.toLocaleTimeString("en-US", { hour12: true }));
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // 2. Real-Time Cloud Firestore Sync for Bookings, Studio Notes, and Mail
  useEffect(() => {
    // A. Real-time Firestore Listener: bookings
    const bookingsPath = "bookings";
    const unsubscribeBookings = onSnapshot(
      collection(db, bookingsPath),
      async (snapshot) => {
        if (snapshot.empty) {
          // If first boot on fresh database, seed initial studio bookings to Firestore
          const initialSeed: Booking[] = [
            {
              id: "b1",
              clientName: "Paranoid Sunsets (Rock)",
              date: "2026-05-26",
              timeSlot: "11:00 AM - 01:00 PM",
              type: "Jam",
              defaultRate: 350,
              overrideRate: null,
              finalRate: 350,
              hours: 2,
              totalAmount: 700,
              status: "Completed",
              equipment: ["Yamaha Stage Custom Drumkit", "Fender Frontman 212R Guitar Amp", "Ampeg BA-210 Bass Combo"],
              customRequests: "Needs an extra microphone stand and 1/4 inch jacks",
              reminderSent: true,
              createdAt: "2026-05-24T12:30:00Z"
            },
            {
              id: "b2",
              clientName: "Symphony of Echoes (Metal)",
              date: "2026-05-26",
              timeSlot: "03:00 PM - 05:00 PM",
              type: "Recording",
              defaultRate: 600,
              overrideRate: 550,
              finalRate: 550,
              hours: 2,
              totalAmount: 1100,
              status: "Live Now",
              equipment: ["Yamaha Stage Custom Drumkit", "Marshall MG100HCFX Half Stack", "Focusrite Scarlett 18i20 Interface", "Ampeg BA-210 Bass Combo"],
              customRequests: "Multitrack recording of drum setup. Arriving 15 mins early.",
              reminderSent: true,
              createdAt: "2026-05-25T09:15:00Z"
            },
            {
              id: "b3",
              clientName: "Riya & Friends",
              date: "2026-05-26",
              timeSlot: "07:00 PM - 09:00 PM",
              type: "Karaoke",
              defaultRate: 400,
              overrideRate: null,
              finalRate: 400,
              hours: 2,
              totalAmount: 800,
              status: "Up Next",
              equipment: ["Shure SM58 Vocal Microphone (Pair)", "JBL PRX815 Active PA Speakers"],
              customRequests: "Needs additional screen / lyric display set up correctly",
              reminderSent: false,
              createdAt: "2026-05-26T08:00:00Z"
            },
            {
              id: "b4",
              clientName: "The Velvet Anthems (Indie)",
              date: "2026-05-27",
              timeSlot: "01:00 PM - 03:00 PM",
              type: "Jam",
              defaultRate: 350,
              overrideRate: null,
              finalRate: 350,
              hours: 2,
              totalAmount: 700,
              status: "Up Next",
              equipment: ["Yamaha Stage Custom Drumkit", "Korg Triton LE Synthesizer/Keyboard", "Fender Frontman 212R Guitar Amp"],
              customRequests: "Requesting key card access entry, setup synthesizer on the left stand",
              reminderSent: false,
              createdAt: "2026-05-25T14:40:00Z"
            }
          ];

          for (const b of initialSeed) {
            try {
              await setDoc(doc(db, bookingsPath, b.id), b);
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, bookingsPath);
            }
          }
          setBookings(initialSeed);
        } else {
          const loaded: Booking[] = [];
          snapshot.forEach((docSnap) => {
            loaded.push(docSnap.data() as Booking);
          });
          // Sort chronologically
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
          // Seed default notes to Firestore
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

    // C. Real-time Firestore Listener: mail (Email dispatch trigger records)
    const mailPath = "mail";
    const unsubscribeMail = onSnapshot(
      collection(db, mailPath),
      (snapshot) => {
        const loadedLogs: EmailLog[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loadedLogs.push({
            id: docSnap.id,
            recipient: data.to || ADMIN_EMAIL,
            subject: data.subject || "THE JAM JUNCTION Notification",
            body: data.body || "",
            type: "confirmation",
            timestamp: data.createdAt || new Date().toISOString(),
            status: data.status === "failed" ? "failed" : "sent"
          });
        });

        // Add seed logs if mail collection is fresh
        if (loadedLogs.length === 0) {
          const seedLogs: EmailLog[] = [
            {
              id: "e_init_1",
              recipient: "paranoidsunsets@gmail.com",
              subject: "🎹 THE JAM JUNCTION - Booking Confirmation for 2026-05-26",
              body: "Your session has been successfully locked into our daily scheduler.",
              type: "confirmation",
              timestamp: "2026-05-24T12:30:10Z",
              status: "sent"
            },
            {
              id: "e_init_2",
              recipient: ADMIN_EMAIL,
              subject: "⚡ THE JAM JUNCTION - Soundcheck Reminder Alert (60 min)",
              body: "Dispatch alert sent to supervisor: Recording Session starts in 1 hour.",
              type: "reminder",
              timestamp: "2026-05-26T14:00:00Z",
              status: "sent"
            }
          ];
          setEmailLogs(seedLogs);
        } else {
          loadedLogs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
          setEmailLogs(loadedLogs);
        }
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
      // 1. Write booking directly to Cloud Firestore 'bookings' collection
      await setDoc(doc(db, bookingsPath, newBooking.id), newBooking);

      // 2. Trigger automatic booking confirmation email and dispatch log alert to narkhedeatharva2106@gmail.com
      const clientEmail = `${newBooking.clientName.trim().replace(/\s+/g, "").toLowerCase()}@gmail.com`;
      const mailId = "mail_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);

      const emailPayload = {
        to: clientEmail,
        adminAlertTo: ADMIN_EMAIL,
        subject: `🎹 THE JAM JUNCTION - Booking Confirmation for ${newBooking.date} (${newBooking.clientName})`,
        body: `Hi ${newBooking.clientName},\n\nYour session has been successfully reserved and locked into THE JAM JUNCTION Studio Schedule!\n\n📅 Date: ${newBooking.date}\n⏰ Time Slot: ${newBooking.timeSlot}\n🎸 Session Type: ${newBooking.type} Session (${newBooking.hours} Hrs @ ₹${newBooking.finalRate}/hr)\n🎧 Total Bill: ₹${newBooking.totalAmount}\n🛠️ Reserved Equipment: ${newBooking.equipment.join(", ") || "Standard Studio Gear"}\n📝 Requests: ${newBooking.customRequests || "None"}\n\n[DISPATCH AUDIT ALERT]\nAuto-dispatched and logged for studio supervisor: ${ADMIN_EMAIL}`,
        bookingId: newBooking.id,
        clientName: newBooking.clientName,
        status: "sent",
        createdAt: new Date().toISOString()
      };

      // Write email document to Firestore 'mail' collection
      await setDoc(doc(db, mailPath, mailId), emailPayload);

      showToast(`✓ Booking saved to Cloud Firestore & Dispatch alert sent to ${ADMIN_EMAIL}!`, "success");
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

  const handleSendEmailLog = (log: EmailLog) => {
    setEmailLogs(current => [log, ...current]);
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

      {/* TOP MASTER LEVEL TELEMETRY HEADER */}
      <header className="sticky top-0 z-40 bg-black/45 backdrop-filter backdrop-blur-md border-b border-white/5 px-4 md:px-8 py-5 pointer-events-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Spacer to balance center alignment on desktop */}
          <div className="hidden md:block w-48 shrink-0" aria-hidden="true" />

          {/* Centered Large Bold Italic Capital Cursive Brand Title */}
          <div className="text-center flex-1 flex flex-col items-center justify-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black italic uppercase tracking-wider font-cursive select-none animate-hue-loop bg-gradient-to-r from-purple-300 via-pink-400 to-indigo-300 bg-clip-text text-transparent drop-shadow-sm">
              THE JAM JUNCTION
            </h1>
            <p className="text-[11px] sm:text-xs text-purple-300 font-serif italic tracking-widest mt-1">
              where soundchecks turn into masterpieces.
            </p>
          </div>

          {/* Supervisor Profile & Email Alerts Controls */}
          <div className="flex items-center gap-2.5 flex-wrap justify-center md:justify-end text-xs font-mono w-full md:w-48 shrink-0">
            {/* Owner Profile Indicator */}
            <div className="bg-[#121212]/80 border border-white/5 py-1.5 px-3 rounded-lg flex items-center gap-2 text-left">
              <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <div>
                <span className="text-gray-400 text-[9px] block leading-none">Supervisor</span>
                <span className="text-white font-extrabold text-[10px] truncate block max-w-32 mt-0.5">
                  {supervisorEmail}
                </span>
              </div>
            </div>

            {/* Email Alerts Trigger Drawer Button */}
            <button
              onClick={() => setIsLogsOpen(!isLogsOpen)}
              className="bg-[#1C1C24]/90 hover:bg-purple-950/20 border border-purple-500/25 text-purple-300 hover:text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer font-bold transition-all duration-300"
              title="Open Email Dispatch Telemetry Log"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Alerts</span>
              ({emailLogs.length})
            </button>
          </div>
        </div>
      </header>

      {/* CORE CONTENT BLOCK CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-8 space-y-8 relative z-10">
        
        {/* BRAND PROMOTIONS ACCENT */}
        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden pointer-events-auto">
          <div className="absolute top-0 right-0 w-80 h-40 bg-purple-600/10 rounded-full blur-3xl" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 text-purple-400 text-[10px] uppercase tracking-widest font-extrabold font-mono mb-1">
                <span className="bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  Direct Studio Console
                </span>
                <span>Real-Time Cloud Sync Active</span>
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
                <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Maintenance Items</span>
                <span className="text-xl font-bold font-mono text-pink-400">
                  {notes.filter(n => n.category === "urgent").length} Critical Task{notes.filter(n => n.category === "urgent").length !== 1 && "s"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* INTERACTIVE COMPONENT NAVIGATION TAB HEADER */}
        <div className="flex items-center bg-black/40 p-1.5 rounded-2xl border border-white/5 max-w-3xl pointer-events-auto">
          <button
            onClick={() => setActiveTab("entry")}
            className={`flex-1 text-center font-bold text-xs uppercase py-3 rounded-xl transition duration-500 flex items-center justify-center gap-2 cursor-pointer ${
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
            className={`flex-1 text-center font-bold text-xs uppercase py-3 rounded-xl transition duration-500 flex items-center justify-center gap-2 cursor-pointer ${
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
            className={`flex-1 text-center font-bold text-xs uppercase py-3 rounded-xl transition duration-500 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "revenue"
                ? "bg-gradient-to-r from-[#1E1E2E] to-purple-950/40 text-white border border-purple-500/40 shadow-inner"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Financial Analytics</span>
            <span className="sm:hidden">Revenue</span>
          </button>

          <button
            onClick={() => setActiveTab("notes")}
            className={`flex-1 text-center font-bold text-xs uppercase py-3 rounded-xl transition duration-500 flex items-center justify-center gap-2 cursor-pointer ${
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
            />
          )}

          {activeTab === "schedule" && (
            <DailySchedule 
              bookings={bookings}
              onUpdateBookingStatus={handleUpdateBookingStatus}
              onDeleteBooking={handleDeleteBooking}
            />
          )}

          {activeTab === "revenue" && (
            <RevenueAnalytics 
              bookings={bookings}
              onSendEmailLog={handleSendEmailLog}
              userEmail={supervisorEmail}
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

      {/* DISPATCH TELEMETRY EMAIL LOGS FLOATING DRAWER */}
      {isLogsOpen && (
        <div className="fixed inset-y-0 right-0 w-80 md:w-96 bg-[#0E0E14] border-l border-white/10 shadow-2xl z-50 p-6 flex flex-col justify-between animate-fadeIn pointer-events-auto">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Dispatched Alerts</h3>
              </div>
              <button
                onClick={() => setIsLogsOpen(false)}
                className="text-xs text-gray-500 hover:text-white cursor-pointer px-2 py-1 rounded bg-white/5 hover:bg-white/10"
              >
                Close ✕
              </button>
            </div>

            <p className="text-[11px] text-gray-400 mb-4">
              Real-time audit records of all confirmation notices dispatched via Cloud Firestore <code className="text-purple-300">mail</code> trigger collection to client endpoints and supervisor <span className="text-white font-mono">{ADMIN_EMAIL}</span>:
            </p>

            <div className="space-y-3.5 overflow-y-auto max-h-[80vh] pr-1">
              {emailLogs.length === 0 ? (
                <div className="text-xs text-gray-600 italic text-center py-6">
                  No automated reports dispatched yet. Try logging a new booking in Command Center.
                </div>
              ) : (
                emailLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-lg bg-black/40 border border-[#23232a] space-y-2 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[8px] uppercase tracking-widest font-extrabold px-1.5 py-0.5 rounded ${
                        log.type === "confirmation" ? "bg-purple-950/20 text-purple-400" :
                        log.type === "reminder" ? "bg-indigo-950/20 text-indigo-400" : "bg-teal-950/20 text-teal-300"
                      }`}>
                        {log.type}
                      </span>
                      <span className="text-[8px] font-mono text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] text-gray-500 block">Recipient</span>
                      <span className="text-xs text-gray-200 truncate font-semibold block">{log.recipient}</span>
                    </div>

                    <div>
                      <span className="text-[9px] text-gray-500 block">Subject Line</span>
                      <span className="text-xs text-white block truncate">{log.subject}</span>
                    </div>

                    <div className="bg-[#121212]/30 p-2 rounded text-[9px] text-gray-400 font-mono whitespace-pre-wrap max-h-24 overflow-y-auto max-w-full">
                      {log.body}
                    </div>

                    <div className="flex justify-between items-center pt-1 text-[8px] text-gray-500 font-mono">
                      <span>Status: <strong className="text-emerald-400">● FIRESTORE DISPATCHED</strong></span>
                      <span>Alert: {ADMIN_EMAIL.split("@")[0]}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 text-[9px] text-gray-600 font-mono text-center">
            The Jam Junction • Cloud Firestore Real-Time Dispatch Console
          </div>
        </div>
      )}

    </div>
  );
}
