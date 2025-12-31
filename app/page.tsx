"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { logout, deleteAccount } from "@/lib/supabase/auth-actions";
import { Button } from "@/components/ui/button";
import { LoginForm } from "@/components/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  LogOut,
  Trash2,
  ListTodo,
  BookImage,
  Soup,
  NotebookText,
} from "lucide-react";
import Pokeball from "@/public/icons/Pokeball";
import { toast } from "react-toastify";

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
      toast.error("Login failed: " + error.message);
      setLoginError(error.message);
      return;
    } else {
      toast.success("Login successful!");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Spinner className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-muted/30 p-4 md:p-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <h1 className="text-2xl font-bold">Hi there! {user.email} 👋</h1>
          {/* Activities Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Todo List Card */}
            <Card className="border-border/30 shadow hover:shadow-md transition justify-between">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <ListTodo className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg font-semibold">
                    Todo List
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Manage and track your tasks efficiently.
                </p>
              </CardContent>
              <CardContent>
                <Button asChild size="sm" className="mt-4">
                  <a href="/todolist">Go to Todo List</a>
                </Button>
              </CardContent>
            </Card>

            {/* Photos Lite Card */}
            <Card className="border-border/30 shadow hover:shadow-md transition justify-between">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <BookImage className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg font-semibold">
                    Photos Lite
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View and organize your photos in a lightweight interface.
                </p>
              </CardContent>
              <CardContent>
                <Button asChild size="sm" className="mt-4">
                  <a href="/drive-lite">Go to Photos Lite</a>
                </Button>
              </CardContent>
            </Card>

            {/* Food Review Card */}
            <Card className="border-border/30 shadow hover:shadow-md transition justify-between">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Soup className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg font-semibold">
                    Food Review
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Write and browse reviews for your favorite meals.
                </p>
              </CardContent>
              <CardContent>
                <Button asChild size="sm" className="mt-4">
                  <a href="/food-review">Go to Food Review</a>
                </Button>
              </CardContent>
            </Card>

            {/* Pokemon Review Card */}
            <Card className="border-border/30 shadow hover:shadow-md transition justify-between">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Pokeball className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg font-semibold">
                    Pokemon Review
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Track, review, and rate your favorite Pokémon.
                </p>
              </CardContent>
              <CardContent>
                <Button asChild size="sm" className="mt-4">
                  <a href="/pokemon">Go to Pokemon Review</a>
                </Button>
              </CardContent>
            </Card>

            {/* Notes Markdown Card */}
            <Card className="border-border/30 shadow hover:shadow-md transition justify-between">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <NotebookText className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg font-semibold">
                    Notes Markdown
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Take and manage your notes in Markdown format.
                </p>
              </CardContent>
              <CardContent>
                <Button asChild size="sm" className="mt-4">
                  <a href="/notes">Go to Notes Markdown</a>
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="border-destructive/20 bg-destructive/5 shadow-sm mt-8">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Account Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Deleting your account will permanently remove all your data.
                This action cannot be undone.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => logout()}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                  onClick={async () => await deleteAccount()}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <LoginForm
          setEmail={setEmail}
          setPassword={setPassword}
          handleLogin={handleLogin}
          loginError={loginError}
        />
      </div>
    </div>
  );
}
