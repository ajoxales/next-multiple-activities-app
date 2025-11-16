"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { RegisterForm } from "@/components/register-form";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    console.log("Sign up data:", data);

    if (error) {
      setMessage(error.message);
    } else {
      router.push("/");
    }
  };

  return (
    <div>
      <div className="flex w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <RegisterForm
            setEmail={setEmail}
            setPassword={setPassword}
            handleRegister={handleRegister}
            registerError={message}
          />
        </div>
      </div>
    </div>
  );
}
