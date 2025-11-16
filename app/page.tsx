"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { logout, deleteAccount } from "@/lib/supabase/auth-actions";
import { Button } from "@/components/ui/button";
import { LoginForm } from "@/components/login-form";

export default function HomePage() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoading(false);
    };
    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoginError(error.message);
      return;
    }
  };

  if (loading) return <p>Loading...</p>;

  if (user) {
    return (
      <div className="text-center items-center pt-10 ">
        <h1 className="text-2xl font-bold">Welcome, {user.email}</h1>
        <div className="flex gap-4 mx-auto justify-center mt-5">
          <Button
            variant={"outline"}
            onClick={() => {
              logout();
            }}
          >
            Logout
          </Button>
          <Button
            variant={"destructive"}
            onClick={async () => {
              await deleteAccount();
            }}
          >
            Delete Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <LoginForm
            setEmail={setEmail}
            setPassword={setPassword}
            handleLogin={handleLogin}
            loginError={loginError}
          />
        </div>
      </div>
    </div>
  );
}
