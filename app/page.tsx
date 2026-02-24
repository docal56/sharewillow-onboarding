"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOnboardingDispatch } from "@/context/onboarding-context";

export default function SignupPage() {
  const router = useRouter();
  const dispatch = useOnboardingDispatch();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "Company name is required";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Enter a valid email";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 8)
      newErrors.password = "Password must be at least 8 characters";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    dispatch({
      type: "SET_COMPANY_DATA",
      payload: { name: name.trim(), email: email.trim(), password },
    });
    router.push("/company");
  }

  return (
    <AuthLayout heading="Create your account">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="company-name" className="text-sm font-normal text-[#1a1a1a]">
            Company name
          </Label>
          <Input
            id="company-name"
            placeholder="Company name"
            className=""
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-sm font-normal text-[#1a1a1a]">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Email"
            className=""
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password" className="text-sm font-normal text-[#1a1a1a]">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Password"
            className=""
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password}</p>
          )}
        </div>

        <Button
          type="submit"
          className="h-auto w-full rounded-[10px] bg-[#294BE7] px-2 py-3 text-base font-medium hover:bg-[#294BE7]/90"
        >
          Sign up
        </Button>
      </form>
    </AuthLayout>
  );
}
