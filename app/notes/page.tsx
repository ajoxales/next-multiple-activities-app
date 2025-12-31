"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import ReactMarkdown from "react-markdown";

interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
}

export default function NotesPage() {
  const supabase = createClient();
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingContent, setEditingContent] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching notes:", error);
      toast.error("Failed to load notes.");
      return;
    }
    setNotes(data ?? []);
  };

  const addNote = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to add notes.");
      return;
    }

    const { data, error } = await supabase
      .from("notes")
      .insert({
        title,
        content,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Add note error:", error);
      toast.error("Failed to save note.");
      return;
    }

    setNotes((prev) => [data, ...prev]);
    setTitle("");
    setContent("");
    toast.success("Note added.");
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditingTitle(note.title);
    setEditingContent(note.content);
  };

  const saveEdit = async (note: Note) => {
    const { error } = await supabase
      .from("notes")
      .update({
        title: editingTitle,
        content: editingContent,
      })
      .eq("id", note.id);

    if (error) {
      console.error("Update note error:", error);
      toast.error("Failed to update note.");
      return;
    }

    setNotes((prev) =>
      prev.map((n) =>
        n.id === note.id
          ? { ...n, title: editingTitle, content: editingContent }
          : n
      )
    );
    setEditingId(null);
    setEditingTitle("");
    setEditingContent("");
    toast.success("Note updated.");
  };

  const deleteNote = async (id: string) => {
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) {
      console.error("Delete note error:", error);
      toast.error("Failed to delete note.");
      return;
    }
    setNotes((prev) => prev.filter((n) => n.id !== id));
    toast.success("Note deleted.");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Markdown Notes App</h1>

      <div className="flex flex-col gap-2 mb-4">
        <Input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="border p-2 rounded"
          placeholder="Write your note in Markdown..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <Button onClick={addNote}>Add Note</Button>
      </div>

      <ul className="flex flex-col gap-4">
        {notes.map((note) => (
          <li key={note.id} className="border p-2 rounded">
            {editingId === note.id ? (
              <div className="flex flex-col gap-2">
                <Input
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                />
                <textarea
                  className="border p-2 rounded"
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button onClick={() => saveEdit(note)}>Save</Button>
                  <Button
                    variant="destructive"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <h2 className="font-semibold">{note.title}</h2>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => startEdit(note)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteNote(note.id)}
                    >
                      Delete
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        setPreviewId(previewId === note.id ? null : note.id)
                      }
                    >
                      {previewId === note.id ? "Raw" : "Preview"}
                    </Button>
                  </div>
                </div>

                {previewId === note.id ? (
                  <ReactMarkdown>{note.content}</ReactMarkdown>
                ) : (
                  <pre className="whitespace-pre-wrap">{note.content}</pre>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
