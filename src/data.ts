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

export const SEED_BOOKINGS: Booking[] = [];

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
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return [];
    }
  }
  return [];
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
