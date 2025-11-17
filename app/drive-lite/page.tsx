"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Photo {
  id: string;
  user_id: string;
  name: string;
  file_path: string;
  created_at: string;
  url?: string; // Signed URL
}

export default function PhotosPage() {
  const supabase = createClient();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [photoName, setPhotoName] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date">("date");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  // Fetch photos on mount
  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    else {
      // Generate signed URLs for private bucket
      const photosWithUrl = await Promise.all(
        data.map(async (photo: Photo) => {
          const { data: urlData, error } = await supabase.storage
            .from("photos")
            .createSignedUrl(photo.file_path, 60); // URL valid for 60 seconds
          if (error) console.error(error);
          return { ...photo, url: urlData?.signedUrl };
        })
      );
      setPhotos(photosWithUrl);
    }
  };

  // Upload photo
  const uploadPhoto = async () => {
    if (!file || !photoName.trim()) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const filePath = `${user.id}/${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("photos")
      .upload(filePath, file, { upsert: true });
    if (uploadError) return console.error(uploadError);

    const { data, error } = await supabase
      .from("photos")
      .insert({
        name: photoName,
        file_path: filePath,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) return console.error(error);

    // Generate signed URL for the new photo
    const { data: urlData, error: urlError } = await supabase.storage
      .from("photos")
      .createSignedUrl(filePath, 60);
    if (urlError) console.error(urlError);

    setPhotos((prev) => [{ ...data, url: urlData?.signedUrl }, ...prev]);
    setFile(() => null);
    setPhotoName("");
  };

  // Delete photo
  const deletePhoto = async (photo: Photo) => {
    const { error: storageError } = await supabase.storage
      .from("photos")
      .remove([photo.file_path]);
    if (storageError) console.error(storageError);

    const { error: tableError } = await supabase
      .from("photos")
      .delete()
      .eq("id", photo.id);
    if (tableError) console.error(tableError);

    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
  };

  // Start editing
  const startEditing = (photo: Photo) => {
    setEditingId(photo.id);
    setEditingText(photo.name);
  };

  // Save edit
  const saveEdit = async (photo: Photo) => {
    const { error } = await supabase
      .from("photos")
      .update({ name: editingText })
      .eq("id", photo.id);
    if (error) console.error(error);

    setPhotos((prev) =>
      prev.map((p) => (p.id === photo.id ? { ...p, name: editingText } : p))
    );
    setEditingId(null);
    setEditingText("");
  };

  // Filter + Sort
  const filteredPhotos = photos
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Photos</h1>

      {/* Upload Section */}
      <div className="flex gap-2 mb-4">
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <Input
          placeholder="Photo name"
          value={photoName}
          onChange={(e) => setPhotoName(e.target.value)}
        />
        <Button onClick={uploadPhoto}>Upload</Button>
      </div>

      {/* Search + Sort */}
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select onValueChange={(value: "name" | "date") => setSortBy(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="date">Upload Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Photo List */}
      <ul className="grid grid-cols-3 gap-4">
        {filteredPhotos.map((photo) => (
          <li key={photo.id} className="border p-2 rounded flex flex-col gap-2">
            {photo.url && (
              <img
                src={photo.url}
                alt={photo.name}
                className="h-32 w-full object-contain rounded"
              />
            )}

            {editingId === photo.id ? (
              <div className="flex gap-2">
                <Input
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                />
                <Button onClick={() => saveEdit(photo)}>Save</Button>
              </div>
            ) : (
              <>
                <span className="font-semibold">{photo.name}</span>
                <div className="flex gap-2">
                  <Button onClick={() => startEditing(photo)}>Edit</Button>
                  <Button
                    variant="destructive"
                    onClick={() => deletePhoto(photo)}
                  >
                    Delete
                  </Button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
