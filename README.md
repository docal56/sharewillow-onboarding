# ShareWillow Onboarding Experiment

A 5-step prospect onboarding flow that shows HVAC companies how they compare to industry benchmarks and generates a personalised incentive plan using the Anthropic API.

## Tech Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS v4** + shadcn/ui components
- **Papa Parse** for CSV handling
- **Anthropic SDK** for Claude API calls

## Getting Started

```bash
# Clone the repo
git clone <your-repo-url>
cd sharewillow-onboarding

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## How It Works

1. **Landing** (`/`) — Welcome page with CTA
2. **Signup** (`/signup`) — Enter company name, email, password
3. **Company Info** (`/company`) — Industry, team size, costs, revenue
4. **Benchmarks** (`/benchmarks`) — See how you compare to HVAC industry benchmarks
5. **Connect Data** (`/connect`) — Upload CSV job data + enter Anthropic API key to generate a personalised incentive plan

## Anthropic API Key

The API key is entered by the user directly in the app at step 5. It is:
- Sent to the server only for the Claude API call
- Never logged, stored, or persisted
- No environment variables needed for deployment

Users can get a key at [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys).

## Editing the Prompt

All prompt logic lives in a single file:

```
lib/plan-prompt.ts
```

This file exports `buildPlanPrompt(companyData, csvSummary)` which returns the system and user prompts sent to Claude. Edit this file to change what the AI generates.

## CSV Format

The app looks for these columns in uploaded CSV files:
- `job_total` (or `invoice_total`, `ticket_total`, `amount`) — for average ticket calculation
- `billable_hours` + `total_hours` — for billable efficiency
- `job_type` (or `service_type`, `category`) — for callback rate (looks for keywords: callback, recall, return, warranty, redo)

Column name matching is case-insensitive and ignores underscores/spaces.

## Deploy to Vercel

### One-click deploy
Import the repo on [vercel.com/new](https://vercel.com/new) — no configuration needed.

### CLI deploy
```bash
npm i -g vercel
vercel
```

No environment variables are required for deployment.

## Project Structure

```
app/
  page.tsx                  — Landing page
  signup/page.tsx           — Account creation
  company/page.tsx          — Company info form
  benchmarks/
    page.tsx                — Benchmark dashboard
    layout.tsx              — Layout with modal slot
    @modal/(..)connect/     — Connect data modal overlay
  connect/page.tsx          — Connect data (full page fallback)
  api/generate-plan/        — Claude API route
components/
  auth-layout.tsx           — Two-panel auth layout
  benchmark-card.tsx        — Benchmark metric card
  plan-panel.tsx            — Incentive plan panel
  csv-upload.tsx            — CSV upload + parse
  api-key-input.tsx         — API key input
  ui/                       — shadcn/ui components
context/
  onboarding-context.tsx    — Global state (React Context)
lib/
  benchmarks.ts             — HVAC benchmark data
  plan-prompt.ts            — LLM prompt builder
  csv-parser.ts             — CSV parsing + metric extraction
  utils.ts                  — Tailwind class helper
types/
  index.ts                  — TypeScript interfaces
```
