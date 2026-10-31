/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from "react";
import { StudioNote } from "../types";
import { 
  Plus, Trash2, Tag, Calendar, AlertTriangle, CheckSquare, 
  Wrench, HelpCircle, Flame, StickyNote, Check, Search, X
} from "lucide-react";

interface StudioNotesProps {
  notes: StudioNote[];
  onAddNote: (note: StudioNote) => void;
  onDeleteNote: (id: string) => void;
  onUpdateNote: (updatedNote: StudioNote) => void;
}

export default function StudioNotes({ notes, onAddNote, onDeleteNote, onUpdateNote }: StudioNotesProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<"maintenance" | "modification" | "general" | "urgent">("general");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingContent, setEditingContent] = useState("");
  const [editingCategory, setEditingCategory] = useState<"maintenance" | "modification" | "general" | "urgent">("general");

  const handleCreateNote = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const newNote: StudioNote = {
      id: "note_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8),
      title: title.trim(),
      content: content.trim(),
      category,
      updatedAt: new Date().toISOString()
    };

    onAddNote(newNote);
    setTitle("");
    setContent("");
    setCategory("general");
  };

  const handleStartEdit = (note: StudioNote) => {
    setEditingId(note.id);
    setEditingTitle(note.title);
    setEditingContent(note.content);
    setEditingCategory(note.category);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editingTitle.trim() || !editingContent.trim()) return;

    const updated: StudioNote = {
      id: editingId,
      title: editingTitle.trim(),
      content: editingContent.trim(),
      category: editingCategory,
      updatedAt: new Date().toISOString()
    };

    onUpdateNote(updated);
    setEditingId(null);
  };

  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case "urgent":
        return {
          bg: "bg-red-950/20",
          border: "border-red-500/25",
          accent: "text-red-400",
          label: "Urgent Audit Fail",
          icon: <Flame className="h-4 w-4 text-red-400" />
        };
      case "maintenance":
        return {
          bg: "bg-amber-950/20",
          border: "border-amber-500/20",
          accent: "text-amber-400",
          label: "Rack Calibration",
          icon: <Wrench className="h-4 w-4 text-amber-400" />
        };
      case "modification":
        return {
          bg: "bg-cyan-950/20",
          border: "border-cyan-500/20",
          accent: "text-cyan-400",
          label: "Studio Upgrade",
          icon: <CheckSquare className="h-4 w-4 text-cyan-400" />
        };
      default:
        return {
          bg: "bg-purple-950/10",
          border: "border-purple-500/10",
          accent: "text-purple-400",
          label: "General Memo",
          icon: <HelpCircle className="h-4 w-4 text-purple-400" />
        };
    }
  };

  const filteredNotes = notes.filter(n => {
    const matchesCategory = activeFilter === "All" || n.category === activeFilter;
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 p-1 md:p-3">
      
      {/* LEFT COLUMN: NOTE CREATOR (4 COLUMNS) */}
      <div className="lg:col-span-4 glass-panel rounded-2xl p-6 self-start">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
            <StickyNote className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Scratchpad</h2>
            <p className="text-xs text-gray-400 font-serif italic">Persistent hardware logs & studio upgrades</p>
          </div>
        </div>

        <form onSubmit={handleCreateNote} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Note Subject / Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Mic Cable replace, AC filter"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg text-sm text-white border input-interactive placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-400 pointer-events-auto"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Maintenance Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-4 py-2.5 rounded-lg text-xs text-white border input-interactive cursor-pointer pointer-events-auto"
            >
              <option value="general" className="bg-[#121212] text-white">General Memo</option>
              <option value="maintenance" className="bg-[#121212] text-white">Rack Calibration</option>
              <option value="modification" className="bg-[#121212] text-white">Studio Upgrade</option>
              <option value="urgent" className="bg-[#121212] text-white">Urgent Audit Fail</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Memo Detail log
            </label>
            <textarea
              required
              rows={4}
              placeholder="Log detailed diagnostic, tasks, ordered hardware parts numbers..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg text-xs text-white border input-interactive placeholder-gray-600 focus:outline-none pointer-events-auto"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#1e1e1e] hover:bg-purple-600 border border-purple-500/20 hover:border-purple-400/50 text-purple-300 hover:text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition duration-500 cursor-pointer pointer-events-auto flex items-center justify-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Save Memo Note
          </button>
        </form>
      </div>

      {/* RIGHT COLUMN: STICKY NOTES CONSOLE (8 COLUMNS) */}
      <div className="lg:col-span-8 space-y-5">
        
        {/* FILTERS AND SEARCH */}
        <div className="glass-panel rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search scratchpad memos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs text-white border input-interactive placeholder-gray-600 focus:outline-none pointer-events-auto"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
            {["All", "general", "maintenance", "modification", "urgent"].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all duration-300 capitalize cursor-pointer pointer-events-auto ${
                  activeFilter === cat
                    ? "bg-purple-600 text-white"
                    : "bg-black/40 border border-white/5 text-gray-400 hover:text-white hover:border-white/10"
                }`}
              >
                {cat === "all" ? "All Notes" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* STICKY NOTES GRID */}
        {filteredNotes.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center pointer-events-auto">
            <AlertTriangle className="h-10 w-10 text-purple-400/60 mx-auto mb-3" />
            <p className="text-sm text-gray-300 font-bold">Workspace scratchpad is empty</p>
            <p className="text-xs text-gray-500 mt-1">No pending maintenance items fit this query search descriptor.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNotes.map((note) => {
              const theme = getCategoryTheme(note.category);
              const isEditing = editingId === note.id;

              return (
                <div
                  key={note.id}
                  id={`note-card-${note.id}`}
                  className={`glass-panel rounded-2xl p-5 border flex flex-col justify-between gap-4 transition-all duration-300 hover:shadow-lg ${theme.bg} ${theme.border} pointer-events-auto`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {theme.icon}
                        <span className={`text-[9px] uppercase tracking-wider font-extrabold ${theme.accent}`}>
                          {theme.label}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-gray-500">
                        {new Date(note.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2 pointer-events-auto">
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          className="w-full px-2 py-1.5 rounded bg-black/60 border border-purple-500/30 text-xs text-white"
                        />
                        <select
                          value={editingCategory}
                          onChange={(e) => setEditingCategory(e.target.value as any)}
                          className="w-full px-2 py-1.5 rounded bg-black/60 border border-purple-500/30 text-[10px] text-white"
                        >
                          <option value="general">General Memo</option>
                          <option value="maintenance">Rack Calibration</option>
                          <option value="modification">Studio Upgrade</option>
                          <option value="urgent">Urgent Audit Fail</option>
                        </select>
                        <textarea
                          rows={4}
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          className="w-full px-2 py-1.5 rounded bg-black/60 border border-purple-500/30 text-xs text-gray-300"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1.5 text-left">
                        <h4 className="text-sm font-bold text-white tracking-tight">{note.title}</h4>
                        <p className="text-xs text-gray-300 leading-relaxed font-sans whitespace-pre-wrap">
                          {note.content}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-white/5 pt-3.5 flex items-center justify-between">
                    {isEditing ? (
                      <div className="flex gap-2 w-full">
                        <button
                          onClick={handleSaveEdit}
                          className="flex-1 bg-teal-600 hover:bg-teal-500 text-white text-[10px] py-1.5 rounded-lg flex items-center justify-center gap-1 font-semibold transition cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" /> Save Changes
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2 py-1.5 bg-black/40 hover:bg-black/60 border border-white/5 text-gray-400 hover:text-white rounded-lg transition text-[10px] cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" /> Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStartEdit(note)}
                          className="text-[10px] text-gray-500 hover:text-[#F5F5F7] font-semibold transition cursor-pointer"
                        >
                          Edit note
                        </button>

                        <button
                          onClick={() => onDeleteNote(note.id)}
                          className="p-1.5 rounded bg-black/20 hover:bg-red-950/20 text-gray-500 hover:text-red-400 border border-transparent hover:border-red-500/10 transition cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}
