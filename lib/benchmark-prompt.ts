/**
 * Benchmark generation prompt.
 *
 * Edit the SYSTEM and RULES sections below to control
 * what OpenAI returns for the benchmark cards.
 */

interface BenchmarkPromptInput {
  industryLabel: string;
  teamSize: number;
  userValues: Record<string, number>;
}

/**
 * Format the user's known values as readable lines for the prompt.
 */
function formatUserValues(uv: Record<string, number>): string {
  const lines: string[] = [];

  if (uv.annualRevenue)
    lines.push(
      `Annual Revenue: $${uv.annualRevenue.toLocaleString("en-US")}`
    );
  if (uv.laborRate)
    lines.push(`Labor Rate (staff costs as % of revenue): ${uv.laborRate}%`);
  if (uv.avgJobValue)
    lines.push(`Average Job Value: $${uv.avgJobValue}`);
  if (uv.monthlyRevenuePerMember)
    lines.push(`Monthly Revenue Per Member: $${uv.monthlyRevenuePerMember}`);

  return lines.length > 0
    ? `\n\nThe user's actual values are:\n${lines.join("\n")}\n`
    : "";
}

export function buildBenchmarkPrompt({
  industryLabel,
  teamSize,
  userValues,
}: BenchmarkPromptInput): { system: string; user: string } {
  const userBlock = formatUserValues(userValues);

  // ── SYSTEM PROMPT ─────────────────────────────────────────────────
  const system = `You are an expert business consultant. Your task is to research and provide accurate industry performance benchmarks, then write personalised insight text for this specific user.

Search the web for real benchmark data for ${industryLabel} companies with approximately ${teamSize} employees. Look for industry reports, trade association data, and business performance surveys.
${userBlock}
After researching, return ONLY a valid JSON object with this exact structure — no markdown, no code fences, no explanation:
{
  "benchmarks": [
    {
      "name": "string — camelCase identifier",
      "displayName": "string — human-readable name",
      "description": [
        [
          { "text": "string — plain text" },
          { "text": "string — highlighted text", "color": "green" }
        ],
        [
          { "text": "string — second paragraph" },
          { "text": "string — highlighted text", "color": "red" }
        ]
      ],
      "lower": "number — bottom quartile value",
      "median": "number — 50th percentile value",
      "upper": "number — top quartile value",
      "unit": "currency | percentage | rating | currencyPerMonth",
      "prefix": "string — optional, e.g. '$'",
      "suffix": "string — optional, e.g. '%'",
      "invertedScale": "boolean — true when lower numeric value = better"
    }
  ]
}

Rules:
1. Generate exactly 7 benchmarks most relevant to ${industryLabel} companies with ~${teamSize} employees.
2. The first 3 benchmarks MUST use these exact names: "annualRevenue", "laborRate", "avgJobValue".
3. The remaining 4 should be industry-relevant operational metrics (e.g. billableEfficiency, callbackRate, closeRate, customerRetention, googleRating, etc.).
4. "lower" = bottom quartile, "median" = 50th percentile, "upper" = top quartile.
5. For metrics where lower is better (like labor rate, callback rate), set invertedScale: true and arrange so lower > median > upper numerically.
6. Values must be realistic and sourced from your web research.
7. Use "currency" for dollar amounts, "percentage" for rates, "rating" for scores, "currencyPerMonth" for monthly dollar amounts.
8. Set prefix to "$" for currency/currencyPerMonth, suffix to "%" for percentage.
9. IMPORTANT: For percentage metrics, use whole numbers (e.g. 30 for 30%, NOT 0.30). The suffix "%" is added automatically during display.
10. Return ONLY the JSON object, nothing else.
11. PERSONALISED INSIGHT TEXT — Each benchmark "description" has exactly 2 paragraphs (each an array of text segments). Follow these rules:
    a. Write in second person ("Your revenue of $2.8M…", "Your labor rate of 30%…").
    b. Compare the user's value against the benchmark ranges you researched.
    c. COLOR RULES for the highlighted key phrase in each paragraph:
       - If the user is OUTPERFORMING (better than median): use "green".
       - If the user is UNDERPERFORMING (worse than median): use "red".
       - If the user is IN THE MIDDLE (between lower and upper, roughly at median): do NOT add a "color" property — just plain text segments, no highlight.
       - For invertedScale metrics (lower number = better), "outperforming" means the user's value is LOWER than median.
    d. Each paragraph should have 1-2 sentences. The highlighted phrase should be the key data point or takeaway (e.g. "well above the $1.5M median", "30% is above the 21% industry median").
    e. If you don't have the user's value for a metric, write generic industry insight text and use green for positive thresholds, red for warning thresholds.`;

  // ── USER PROMPT ───────────────────────────────────────────────────
  const user = `Generate performance benchmarks for a ${industryLabel} company with ${teamSize} employees.`;

  return { system, user };
}
