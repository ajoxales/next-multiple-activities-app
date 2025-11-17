"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EyeIcon } from "lucide-react";

interface User {
  id: string;
  email: string;
}

interface FriendRequest {
  id: string;
  user1_id: string;
  user2_id: string;
  status: string;
  requester_email: string;
}

interface Friend {
  id: string;
  email: string;
}

interface SecretMessage {
  id: string;
  user_id: string;
  email: string;
  content: string;
}

export default function SecretPage3() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friendsSecrets, setFriendsSecrets] = useState<SecretMessage[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>(
    {}
  );
  const toggleSecret = (id: string) => {
    setVisibleSecrets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return router.push("/");

      const currentUser = { id: data.user.id, email: data.user.email! };
      setUser(currentUser);

      const friendsData = await fetchFriends(currentUser.id);
      await fetchFriendsSecrets(friendsData, currentUser.id);
      await fetchFriendRequests(currentUser.id);

      setLoading(false);
    };

    load();
  }, []);

  // Fetch friend requests
  const fetchFriendRequests = async (uid: string) => {
    const { data, error } = await supabase
      .from("friendships")
      .select(
        "id, user1_id, user2_id, status, profiles!friendships_user1_id_fkey(email)"
      )
      .eq("user2_id", uid)
      .eq("status", "pending");

    if (error) return console.error(error);

    const formatted: FriendRequest[] =
      data?.map((req: any) => ({
        id: req.id,
        user1_id: req.user1_id,
        user2_id: req.user2_id,
        status: req.status,
        requester_email: req.profiles.email,
      })) || [];

    setFriendRequests(formatted);
  };

  const respondToRequest = async (
    id: string,
    action: "accepted" | "rejected"
  ) => {
    const { error } = await supabase
      .from("friendships")
      .update({ status: action })
      .eq("id", id);

    if (error) return console.error(error);

    if (user) {
      await fetchFriendRequests(user.id);
      await fetchFriends(user.id);
    }
  };

  // Fetch friends
  const fetchFriends = async (uid: string) => {
    const { data, error } = await supabase
      .from("friendships")
      .select(
        `
      id,
      user1_id,
      user2_id,
      status,
      user1:profiles!friendships_user1_id_fkey(email),
      user2:profiles!friendships_user2_id_fkey(email)
    `
      )
      .or(`user1_id.eq.${uid},user2_id.eq.${uid}`)
      .eq("status", "accepted");

    if (error) {
      console.error(error);
      return [];
    }

    setFriends(
      data?.map((f: any) => {
        const friendId = f.user1_id === uid ? f.user2_id : f.user1_id;
        const friendEmail = f.user1_id === uid ? f.user2.email : f.user1.email;
        return { id: friendId, email: friendEmail };
      }) || []
    );
    return data || [];
  };

  // Fetch friends' secret messages
  const fetchFriendsSecrets = async (friends: any[], uid: string) => {
    if (!friends || friends.length === 0) {
      setFriendsSecrets([]);
      return;
    }

    const friendIds: string[] = friends.map((f) =>
      f.user1_id === uid ? f.user2_id : f.user1_id
    );

    if (friendIds.length === 0) {
      setFriendsSecrets([]);
      return;
    }

    const { data: secrets, error } = await supabase
      .from("secret_messages")
      .select("id, user_id, email, content")
      .in("user_id", friendIds);

    if (error) {
      console.error(error);
      return;
    }

    setFriendsSecrets(secrets || []);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Secret Page 3</h1>

      {/*Friend Requests*/}
      <div>
        <h2 className="text-xl font-semibold mb-2">Friend Requests</h2>
        {friendRequests.length === 0 ? (
          <p>No pending requests.</p>
        ) : (
          <ul className="space-y-2">
            {friendRequests.map((req) => (
              <li
                key={req.id}
                className="border p-2 rounded-md flex justify-between items-center"
              >
                <span>{req.requester_email}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => respondToRequest(req.id, "accepted")}
                    className="bg-green-500 text-white px-2 py-1 rounded-md"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => respondToRequest(req.id, "rejected")}
                    className="bg-red-500 text-white px-2 py-1 rounded-md"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Friends List */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Your Friends</h2>
        {friends.length === 0 ? (
          <p>No friends yet.</p>
        ) : (
          <ul className="space-y-2">
            {friends.map((f) => (
              <li key={f.id} className="border p-2 rounded-md">
                {f.email}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Friends' Secret Messages</h2>
        {friendsSecrets.length === 0 ? (
          <p>No secrets yet.</p>
        ) : (
          <ul className="space-y-2">
            {friendsSecrets.map((sec) => (
              <li
                key={sec.id}
                className="border p-2 rounded-md flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <p className="">{sec.email}</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleSecret(sec.id)}
                    >
                      <EyeIcon />
                    </Button>
                  </div>
                </div>
                {visibleSecrets[sec.id] && <div>{sec.content}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
