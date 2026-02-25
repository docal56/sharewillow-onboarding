import type { Metadata } from "next";
import localFont from "next/font/local";
import { OnboardingProvider } from "@/context/onboarding-context";
import "./globals.css";

const matter = localFont({
  src: [
    { path: "./fonts/matter/Matter-TRIAL-Thin.woff2", weight: "100", style: "normal" },
    { path: "./fonts/matter/Matter-TRIAL-ThinItalic.woff2", weight: "100", style: "italic" },
    { path: "./fonts/matter/Matter-TRIAL-Light.woff2", weight: "300", style: "normal" },
    { path: "./fonts/matter/Matter-TRIAL-LightItalic.woff2", weight: "300", style: "italic" },
    { path: "./fonts/matter/Matter-TRIAL-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/matter/Matter-TRIAL-RegularItalic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/matter/Matter-TRIAL-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/matter/Matter-TRIAL-MediumItalic.woff2", weight: "500", style: "italic" },
    { path: "./fonts/matter/Matter-TRIAL-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/matter/Matter-TRIAL-SemiBoldItalic.woff2", weight: "600", style: "italic" },
    { path: "./fonts/matter/Matter-TRIAL-Bold.woff2", weight: "700", style: "normal" },
    { path: "./fonts/matter/Matter-TRIAL-BoldItalic.woff2", weight: "700", style: "italic" },
    { path: "./fonts/matter/Matter-TRIAL-Heavy.woff2", weight: "800", style: "normal" },
    { path: "./fonts/matter/Matter-TRIAL-HeavyItalic.woff2", weight: "800", style: "italic" },
    { path: "./fonts/matter/Matter-TRIAL-Black.woff2", weight: "900", style: "normal" },
    { path: "./fonts/matter/Matter-TRIAL-BlackItalic.woff2", weight: "900", style: "italic" },
  ],
  variable: "--font-matter",
  display: "swap",
});

const p22Mackinac = localFont({
  src: [
    { path: "./fonts/p22-mackinac/P22Mackinac-Book_13.otf", weight: "400", style: "normal" },
    { path: "./fonts/p22-mackinac/P22Mackinac-BookItalic_5.otf", weight: "400", style: "italic" },
    { path: "./fonts/p22-mackinac/P22Mackinac-Medium_6.otf", weight: "500", style: "normal" },
    { path: "./fonts/p22-mackinac/P22Mackinac-MedItalic_22.otf", weight: "500", style: "italic" },
    { path: "./fonts/p22-mackinac/P22Mackinac-Bold_23.otf", weight: "700", style: "normal" },
    { path: "./fonts/p22-mackinac/P22Mackinac-BoldItalic_7.otf", weight: "700", style: "italic" },
    { path: "./fonts/p22-mackinac/P22Mackinac-ExtraBold_9.otf", weight: "800", style: "normal" },
    { path: "./fonts/p22-mackinac/P22Mackinac-ExtraBoldItalic_4.otf", weight: "800", style: "italic" },
  ],
  variable: "--font-p22-mackinac",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ShareWillow — HVAC Incentive Plans",
  description:
    "See how your HVAC business compares to industry benchmarks and get a personalised incentive plan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${matter.variable} ${p22Mackinac.variable} antialiased font-sans`}
      >
        <OnboardingProvider>{children}</OnboardingProvider>
      </body>
    </html>
  );
}
