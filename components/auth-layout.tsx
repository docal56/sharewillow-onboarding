"use client";

import { type ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  heading?: string;
  subheading?: string;
}

export function AuthLayout({ children, heading, subheading }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Left panel — form */}
      <div className="flex flex-col justify-center px-8 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <p className="text-sm font-semibold tracking-wide text-primary">
              ShareWillow
            </p>
          </div>
          {heading && (
            <h1 className="mb-2 font-display text-3xl tracking-tight sm:text-4xl">
              {heading}
            </h1>
          )}
          {subheading && (
            <p className="mb-8 text-muted-foreground">{subheading}</p>
          )}
          {children}
        </div>
      </div>

      {/* Right panel — social proof */}
      <div className="hidden flex-col justify-between bg-[#0F172A] p-12 text-white lg:flex">
        <div />
        <div>
          <blockquote className="text-lg leading-relaxed opacity-90">
            &ldquo;We saw a 23% increase in average ticket value within 3 months
            of implementing ShareWillow&rsquo;s incentive plans.&rdquo;
          </blockquote>
          <div className="mt-6">
            <p className="font-semibold">Mike Rodriguez</p>
            <p className="text-sm text-white/60">
              Owner, Summit Heating & Cooling
            </p>
          </div>
        </div>
        <p className="text-xs text-white/40">
          Trusted by 200+ HVAC companies across the US
        </p>
      </div>
    </div>
  );
}
