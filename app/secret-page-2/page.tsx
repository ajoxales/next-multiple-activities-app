"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface SecretMessage {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export default function SecretPage2() {
  const supabase = createClient();
  const [message, setMessage] = useState<SecretMessage | null>(null);
  const [newContent, setNewContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const router = useRouter();

  const fetchMessage = async () => {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) return;

    const { data, error } = await supabase
      .from("secret_messages")
      .select("*")
      .eq("user_id", userId)
      .limit(1)
      .single();

    if (error) {
      console.error(error);
    } else if (data) {
      setMessage(data as SecretMessage);
      setNewContent(data.content);
    } else {
      setMessage(null);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) router.push("/");
      else {
        await fetchMessage();
        setLoading(false);
      }
    };
    checkAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) router.push("/");
        else fetchMessage();
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [router]);

  const handleSave = async () => {
    if (!newContent) return;

    const { data: authData } = await supabase.auth.getUser();
    const email = authData?.user?.email;
    if (!email) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (!profile?.id) return;

    if (message) {
      const { error } = await supabase
        .from("secret_messages")
        .update({ content: newContent, updated_at: new Date(), email })
        .eq("id", message.id);
      if (error) console.error(error);
    } else {
      const { error } = await supabase
        .from("secret_messages")
        .insert([{ content: newContent, user_id: profile.id, email }]);
      if (error) console.error(error);
    }

    await fetchMessage();
    setEditing(false);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Secret Page 2</h1>

      <p className="text-sm text-gray-500 mb-2">Input your secret message</p>
      {editing ? (
        <div className="mb-4 flex gap-2">
          <Textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="border p-2 rounded-md flex-1"
            rows={3}
          />
          <Button onClick={handleSave}>Save</Button>
          <Button onClick={() => setEditing(false)} variant="outline">
            Cancel
          </Button>
        </div>
      ) : (
        <div className="mb-4 flex items-center justify-between">
          <p className="border p-2 rounded-md flex-1 mr-2">
            {message?.content || "No secret yet."}
          </p>
          <Button onClick={() => setEditing(true)}>Edit</Button>
        </div>
      )}

      {message && (
        <div className="border p-2 rounded-md">
          <p className="text-sm text-gray-600">Last saved:</p>
          <p>{message.content}</p>
        </div>
      )}
    </div>
  );
}
