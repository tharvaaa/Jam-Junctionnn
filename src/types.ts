/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BookingType = "Jam" | "Karaoke" | "Recording";
export type BookingStatus = "Up Next" | "Live Now" | "Completed" | "Cancelled";

export interface Booking {
  id: string;
  clientName: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g., "10:00 - 11:00"
  type: BookingType;
  defaultRate: number; // ₹350, ₹400, or custom rate
  overrideRate: number | null; // Value if overriden
  finalRate: number; // Adjusted price per hour
  hours: number; // Booking duration in hours
  totalAmount: number; // finalRate * hours
  status: BookingStatus;
  equipment: string[];
  customRequests: string;
  reminderSent: boolean;
  createdAt: string;
}

export interface StudioNote {
  id: string;
  title: string;
  content: string;
  category: "maintenance" | "modification" | "general" | "urgent";
  updatedAt: string;
}

export interface EmailLog {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  type: "confirmation" | "reminder" | "report";
  timestamp: string;
  status: "sent" | "failed";
  clientName?: string;
  bookingId?: string;
  hours?: number;
  totalAmount?: number;
}
