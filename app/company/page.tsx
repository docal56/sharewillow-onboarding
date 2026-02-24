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

const INDUSTRIES = [
  "HVAC",
  "Plumbing",
  "Electrical",
  "General Contracting",
  "Other",
];

export default function CompanyPage() {
  const router = useRouter();
  const dispatch = useOnboardingDispatch();
  const [industry, setIndustry] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [staffCosts, setStaffCosts] = useState("");
  const [annualRevenue, setAnnualRevenue] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!industry) newErrors.industry = "Select an industry";
    if (!teamSize || parseInt(teamSize) <= 0)
      newErrors.teamSize = "Enter a valid team size";
    if (!staffCosts || parseFloat(staffCosts) <= 0)
      newErrors.staffCosts = "Enter annual staff costs";
    if (!annualRevenue || parseFloat(annualRevenue) <= 0)
      newErrors.annualRevenue = "Enter annual revenue";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    dispatch({
      type: "SET_COMPANY_DATA",
      payload: {
        industry,
        teamSize: parseInt(teamSize),
        staffCosts: parseFloat(staffCosts),
        annualRevenue: parseFloat(annualRevenue),
      },
    });
    router.push("/benchmarks");
  }

  return (
    <AuthLayout
      heading="Tell us about your company"
      subheading="This helps us compare you against the right benchmarks."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger id="industry">
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

        <div className="space-y-2">
          <Label htmlFor="team-size">Number of Technicians</Label>
          <Input
            id="team-size"
            type="number"
            min="1"
            placeholder="e.g. 18"
            value={teamSize}
            onChange={(e) => setTeamSize(e.target.value)}
          />
          {errors.teamSize && (
            <p className="text-xs text-destructive">{errors.teamSize}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="staff-costs">Annual Staff Costs</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              $
            </span>
            <Input
              id="staff-costs"
              type="number"
              min="0"
              placeholder="e.g. 1200000"
              className="pl-7"
              value={staffCosts}
              onChange={(e) => setStaffCosts(e.target.value)}
            />
          </div>
          {errors.staffCosts && (
            <p className="text-xs text-destructive">{errors.staffCosts}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="annual-revenue">Annual Revenue</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              $
            </span>
            <Input
              id="annual-revenue"
              type="number"
              min="0"
              placeholder="e.g. 3800000"
              className="pl-7"
              value={annualRevenue}
              onChange={(e) => setAnnualRevenue(e.target.value)}
            />
          </div>
          {errors.annualRevenue && (
            <p className="text-xs text-destructive">{errors.annualRevenue}</p>
          )}
        </div>

        <Button type="submit" className="w-full" size="lg">
          See my benchmarks
        </Button>
      </form>
    </AuthLayout>
  );
}
