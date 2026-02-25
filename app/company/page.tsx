"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOnboardingDispatch } from "@/context/onboarding-context";

function parseNumber(value: string): number {
  return Number(value.replace(/[^0-9.]/g, "")) || 0;
}

function formatCurrency(value: string): string {
  const num = value.replace(/[^0-9]/g, "");
  if (!num) return "";
  return Number(num).toLocaleString("en-US");
}

const INDUSTRIES = [
  "HVAC",
  "Plumbing",
  "Electrical",
  "Roofing",
  "Other",
];

export default function CompanyPage() {
  const router = useRouter();
  const dispatch = useOnboardingDispatch();
  const [industry, setIndustry] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [numberOfTechs, setNumberOfTechs] = useState("");
  const [staffCosts, setStaffCosts] = useState("");
  const [annualRevenue, setAnnualRevenue] = useState("");
  const [avgJobValue, setAvgJobValue] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!industry) newErrors.industry = "Select an industry";
    if (!teamSize || parseNumber(teamSize) <= 0)
      newErrors.teamSize = "Enter a valid team size";
    if (!numberOfTechs || parseNumber(numberOfTechs) <= 0)
      newErrors.numberOfTechs = "Enter a valid number of technicians";
    if (!staffCosts || parseNumber(staffCosts) <= 0)
      newErrors.staffCosts = "Enter annual staff costs";
    if (!annualRevenue || parseNumber(annualRevenue) <= 0)
      newErrors.annualRevenue = "Enter annual revenue";
    if (!avgJobValue || parseNumber(avgJobValue) <= 0)
      newErrors.avgJobValue = "Enter average job value";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    dispatch({
      type: "SET_COMPANY_DATA",
      payload: {
        industry,
        teamSize: parseNumber(teamSize),
        numberOfTechs: parseNumber(numberOfTechs),
        staffCosts: parseNumber(staffCosts),
        annualRevenue: parseNumber(annualRevenue),
        avgJobValue: parseNumber(avgJobValue),
      },
    });
    router.push("/benchmarks");
  }

  return (
    <AuthLayout
      heading="Tell us about your company"
      subheading="Once you give us your details we can show you how you compare to similar companies."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="industry" className="text-sm font-normal text-[#1a1a1a]">
            Industry
          </Label>
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger
              id="industry"
              className="data-[size=default]:h-auto w-full rounded-lg border-[#e4e4e4] bg-white p-3 text-sm leading-[18px] data-[placeholder]:text-[#78716c]"
            >
              <SelectValue placeholder="Select your industry" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((ind) => (
                <SelectItem key={ind} value={ind}>
                  {ind}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.industry && (
            <p className="text-xs text-destructive">{errors.industry}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="team-size" className="text-sm font-normal text-[#1a1a1a]">
            Number of team members
          </Label>
          <Input
            id="team-size"
            type="text"
            inputMode="numeric"
            placeholder="How many team members do you have?"
            className=""
            value={teamSize}
            onChange={(e) => setTeamSize(e.target.value)}
          />
          {errors.teamSize && (
            <p className="text-xs text-destructive">{errors.teamSize}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="number-of-techs" className="text-sm font-normal text-[#1a1a1a]">
            Number of Techs
          </Label>
          <Input
            id="number-of-techs"
            type="text"
            inputMode="numeric"
            placeholder="How many technicians are on your team?"
            className=""
            value={numberOfTechs}
            onChange={(e) => setNumberOfTechs(e.target.value)}
          />
          {errors.numberOfTechs && (
            <p className="text-xs text-destructive">{errors.numberOfTechs}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="staff-costs" className="text-sm font-normal text-[#1a1a1a]">
            Annual Staff Costs
          </Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm leading-[18px] text-[#78716c]">
              $
            </span>
            <Input
              id="staff-costs"
              type="text"
              inputMode="numeric"
              placeholder="What's your annual staff costs?"
              className="pl-7"
              value={staffCosts}
              onChange={(e) => setStaffCosts(formatCurrency(e.target.value))}
            />
          </div>
          {errors.staffCosts && (
            <p className="text-xs text-destructive">{errors.staffCosts}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="annual-revenue" className="text-sm font-normal text-[#1a1a1a]">
            Annual Revenue
          </Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm leading-[18px] text-[#78716c]">
              $
            </span>
            <Input
              id="annual-revenue"
              type="text"
              inputMode="numeric"
              placeholder="What's your annual revenue?"
              className="pl-7"
              value={annualRevenue}
              onChange={(e) => setAnnualRevenue(formatCurrency(e.target.value))}
            />
          </div>
          {errors.annualRevenue && (
            <p className="text-xs text-destructive">{errors.annualRevenue}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="avg-job-value" className="text-sm font-normal text-[#1a1a1a]">
            Average Job Value
          </Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm leading-[18px] text-[#78716c]">
              $
            </span>
            <Input
              id="avg-job-value"
              type="text"
              inputMode="numeric"
              placeholder="What's your average job value?"
              className="pl-7"
              value={avgJobValue}
              onChange={(e) => setAvgJobValue(formatCurrency(e.target.value))}
            />
          </div>
          {errors.avgJobValue && (
            <p className="text-xs text-destructive">{errors.avgJobValue}</p>
          )}
        </div>

        <Button
          type="submit"
          className="h-auto w-full rounded-[10px] bg-[#294BE7] px-2 py-3 text-base font-medium hover:bg-[#294BE7]/90"
        >
          See how your performing
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Button>
      </form>
    </AuthLayout>
  );
}
