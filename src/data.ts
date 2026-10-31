/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Booking, StudioNote } from "./types";

export const TIME_SLOTS = [
  "09:00 AM - 11:00 AM",
  "11:00 AM - 01:00 PM",
  "01:00 PM - 03:00 PM",
  "03:00 PM - 05:00 PM",
  "05:00 PM - 07:00 PM",
  "07:00 PM - 09:00 PM",
  "09:00 PM - 11:00 PM"
];

export const AVAILABLE_EQUIPMENT = [
  "Yamaha Stage Custom Drumkit",
  "Fender Frontman 212R Guitar Amp",
  "Marshall MG100HCFX Half Stack",
  "Ampeg BA-210 Bass Combo",
  "Shure SM58 Vocal Microphone (Pair)",
  "Sennheiser e835 Vocal Microphone",
  "Korg Triton LE Synthesizer/Keyboard",
  "Yamaha MG16XU 16-Channel Mixer",
  "JBL PRX815 Active PA Speakers",
  "Focusrite Scarlett 18i20 Interface",
  "Studio Headphones (Audio-Technica M50x)"
];

const SEED_BOOKINGS: Booking[] = [
  {
    id: "b1",
    clientName: "Paranoid Sunsets (Rock)",
    date: "2026-05-26", // Today
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
    date: "2026-05-26", // Today
    timeSlot: "03:00 PM - 05:00 PM",
    type: "Recording",
    defaultRate: 600,
    overrideRate: 550, // Owner discount
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
    date: "2026-05-26", // Today
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
    date: "2026-05-27", // Tomorrow
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
  },
  {
    id: "b5",
    clientName: "Sublime Resonance Project",
    date: "2026-05-25", // Yesterday
    timeSlot: "05:00 PM - 07:00 PM",
    type: "Recording",
    defaultRate: 600,
    overrideRate: null,
    finalRate: 600,
    hours: 2,
    totalAmount: 1200,
    status: "Completed",
    equipment: ["Focusrite Scarlett 18i20 Interface", "Studio Headphones (Audio-Technica M50x)", "Shure SM58 Vocal Microphone (Pair)"],
    customRequests: "Vocal tuning session",
    reminderSent: true,
    createdAt: "2026-05-23T11:00:00Z"
  },
  {
    id: "b6",
    clientName: "Late Night Beats LLC",
    date: "2026-05-25", // Yesterday
    timeSlot: "09:00 PM - 11:00 PM",
    type: "Karaoke",
    defaultRate: 400,
    overrideRate: 380, // discounted slightly
    finalRate: 380,
    hours: 2,
    totalAmount: 760,
    status: "Completed",
    equipment: ["Shure SM58 Vocal Microphone (Pair)"],
    customRequests: "Extra ambient neon lighting request",
    reminderSent: true,
    createdAt: "2026-05-24T18:20:00Z"
  },
  {
    id: "b7",
    clientName: "Jazz Fusion Quintet",
    date: "2026-05-24", // Older
    timeSlot: "03:00 PM - 05:00 PM",
    type: "Jam",
    defaultRate: 350,
    overrideRate: null,
    finalRate: 350,
    hours: 2,
    totalAmount: 700,
    status: "Completed",
    equipment: ["Yamaha Stage Custom Drumkit", "Korg Triton LE Synthesizer/Keyboard", "Ampeg BA-210 Bass Combo"],
    customRequests: "Adjust piano velocity scale",
    reminderSent: true,
    createdAt: "2026-05-22T10:15:00Z"
  }
];

export const SEED_NOTES: StudioNote[] = [
  {
    id: "n1",
    title: "Yamaha Mixer Fader Calibration",
    content: "Channel 6 high-mid EQ is cracking when turned around 12 o'clock. Spray contact cleaner on fader 4 and test. Need to complete before recording session on Friday.",
    category: "maintenance",
    updatedAt: "2026-05-26T14:20:00Z"
  },
  {
    id: "n2",
    title: "Vocal Mic XLR Cable Replacement",
    content: "Two 20ft Red XLR cables failed the loop-back continuity test on pin 3. Ordered 5 new Neutrik-connector high-shielded replacement cables, arriving May 29th.",
    category: "urgent",
    updatedAt: "2026-05-25T16:45:00Z"
  },
  {
    id: "n3",
    title: "Karaoke Bluetooth Module Hookup",
    content: "Replaced the generic auxiliary Bluetooth adapter with high-resolution LDAC receiver for immediate latency-free wireless audio transmission from consumer phones.",
    category: "modification",
    updatedAt: "2026-05-24T11:10:00Z"
  },
  {
    id: "n4",
    title: "AC Fan Cleaning Checklist",
    content: "General monthly service log. Back filter screens washed and disinfected with lavender-mint sprays. Thermostat calibrated.",
    category: "general",
    updatedAt: "2026-05-26T09:00:00Z"
  }
];

export const loadInitialBookings = (): Booking[] => {
  const data = localStorage.getItem("jam_junction_bookings");
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return SEED_BOOKINGS;
    }
  }
  localStorage.setItem("jam_junction_bookings", JSON.stringify(SEED_BOOKINGS));
  return SEED_BOOKINGS;
};

export const loadInitialNotes = (): StudioNote[] => {
  const data = localStorage.getItem("jam_junction_notes");
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return SEED_NOTES;
    }
  }
  localStorage.setItem("jam_junction_notes", JSON.stringify(SEED_NOTES));
  return SEED_NOTES;
};

export const saveBookings = (bookings: Booking[]) => {
  localStorage.setItem("jam_junction_bookings", JSON.stringify(bookings));
};

export const saveNotes = (notes: StudioNote[]) => {
  localStorage.setItem("jam_junction_notes", JSON.stringify(notes));
};
