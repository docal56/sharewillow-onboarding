import { BenchmarkMetric } from "@/types";

export const HVAC_BENCHMARKS: BenchmarkMetric[] = [
  {
    name: "annualRevenue",
    displayName: "Annual Revenue",
    description: [
      [
        { text: "You're " },
        { text: "generating $1.3M less", color: "red" },
        { text: " than the median for HVAC companies your size." },
      ],
      [
        { text: "Close that gap and you're looking at an " },
        { text: "extra $108K per month.", color: "green" },
      ],
    ],
    lower: 2500000,
    median: 3800000,
    upper: 6200000,
    unit: "currency",
    prefix: "$",
  },
  {
    name: "laborRate",
    displayName: "Labor Rate",
    description: [
      [
        { text: "You're spending ¢39 of every dollar on staff costs. " },
        { text: "Healthy companies spend closer to ¢26.", color: "green" },
      ],
      [
        { text: "That 7% gap on your current revenue is " },
        { text: "costing you around $275K in profit per year.", color: "red" },
      ],
    ],
    lower: 34,
    median: 26,
    upper: 23,
    unit: "percentage",
    suffix: "%",
    invertedScale: true,
  },
  {
    name: "avgJobValue",
    displayName: "Average Job Value",
    description: [
      [
        { text: "Your average job is worth $170 less than the median." },
      ],
      [
        { text: "With 12 techs running 3 calls a day, " },
        { text: "that's $2,200 in unrealised revenue every single day.", color: "red" },
      ],
    ],
    lower: 200,
    median: 370,
    upper: 600,
    unit: "currency",
    prefix: "$",
  },
  {
    name: "monthlyRevenuePerMember",
    displayName: "Monthly Revenue per Team Member",
    description: [
      [
        { text: "Top crews generate over " },
        { text: "$24K per tech per month.", color: "green" },
      ],
      [
        { text: "The median sits around $15.8K — a " },
        { text: "gap that compounds quickly.", color: "red" },
      ],
    ],
    lower: 10500,
    median: 15800,
    upper: 24600,
    unit: "currencyPerMonth",
    prefix: "$",
  },
  {
    name: "billableEfficiency",
    displayName: "Billable Efficiency",
    description: [
      [
        { text: "Best-in-class teams bill " },
        { text: "75% of available hours.", color: "green" },
      ],
      [
        { text: "The median is 48% — meaning " },
        { text: "half the day isn't generating revenue.", color: "red" },
      ],
    ],
    lower: 30,
    median: 48,
    upper: 75,
    unit: "percentage",
    suffix: "%",
  },
  {
    name: "callbackRate",
    displayName: "Callback Rate",
    description: [
      [
        {
          text: "Every callback costs you a truck roll and a customer's patience.",
        },
      ],
      [
        { text: "Top operators hold callbacks " },
        { text: "under 2.25%.", color: "green" },
      ],
    ],
    lower: 9,
    median: 5,
    upper: 2.25,
    unit: "percentage",
    suffix: "%",
    invertedScale: true,
  },
  {
    name: "googleRating",
    displayName: "Google Rating",
    description: [
      [
        {
          text: "Customers trust reviews before they call. The median HVAC company sits at 4.4 stars.",
        },
      ],
      [
        { text: "Top performers hold " },
        { text: "4.8+.", color: "green" },
      ],
    ],
    lower: 3.8,
    median: 4.4,
    upper: 4.8,
    unit: "rating",
  },
];
