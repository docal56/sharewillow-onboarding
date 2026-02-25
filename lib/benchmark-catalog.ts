import { BenchmarkMetric, RichDescription } from "@/types";

type TeamSizeBand =
  | "5-10"
  | "11-20"
  | "21-50"
  | "51-100"
  | "101-250"
  | "251-500"
  | "501-1000"
  | "1000+";

type InternalMetricName =
  | "annualRevenue"
  | "monthlyRevenuePerMember"
  | "laborRate"
  | "avgJobValue"
  | "billableEfficiency"
  | "callbackRate"
  | "googleRating"
  | "monthlyOvertimeSpend";

interface CsvRow {
  industry: string;
  teamSizeBand: TeamSizeBand;
  metric: string;
  lower: number;
  median: number;
  upper: number;
}

const BAND_ORDER: TeamSizeBand[] = [
  "5-10",
  "11-20",
  "21-50",
  "51-100",
  "101-250",
  "251-500",
  "501-1000",
  "1000+",
];

type BenchmarkCatalog = Record<
  string,
  Partial<Record<TeamSizeBand, Partial<Record<InternalMetricName, CsvRow>>>>
>;

const METRIC_ORDER: InternalMetricName[] = [
  "annualRevenue",
  "monthlyRevenuePerMember",
  "laborRate",
  "avgJobValue",
  "billableEfficiency",
  "callbackRate",
  "googleRating",
  "monthlyOvertimeSpend",
];

const METRIC_META: Record<
  InternalMetricName,
  {
    displayName: string;
    unit: BenchmarkMetric["unit"];
    prefix?: string;
    suffix?: string;
    invertedScale?: boolean;
  }
> = {
  annualRevenue: {
    displayName: "Annual Revenue",
    unit: "currency",
    prefix: "$",
  },
  monthlyRevenuePerMember: {
    displayName: "Monthly Revenue per Team Member",
    unit: "currencyPerMonth",
    prefix: "$",
  },
  laborRate: {
    displayName: "Labor Rate",
    unit: "percentage",
    suffix: "%",
    invertedScale: true,
  },
  avgJobValue: {
    displayName: "Average Job Value",
    unit: "currency",
    prefix: "$",
  },
  billableEfficiency: {
    displayName: "Billable Efficiency",
    unit: "percentage",
    suffix: "%",
  },
  callbackRate: {
    displayName: "Callback Rate",
    unit: "percentage",
    suffix: "%",
    invertedScale: true,
  },
  googleRating: {
    displayName: "Google Rating",
    unit: "rating",
  },
  monthlyOvertimeSpend: {
    displayName: "Monthly Overtime Spend",
    unit: "currencyPerMonth",
    prefix: "$",
    invertedScale: true,
  },
};

const RAW_BENCHMARK_CSV = `industry,team_size_band,metric,lower,median,upper
HVAC,5-10,annualRevenue,1920000,2400000,3000000
HVAC,5-10,avgMonthlyRevenuePerTeamMember,21333,26667,33333
HVAC,5-10,laborRate,35,42,50
HVAC,5-10,avgJobValue,350,500,750
HVAC,5-10,billableEfficiency,24,34,46
HVAC,5-10,callbackRate,2,4,6
HVAC,5-10,avgGoogleRating,4,4,5
HVAC,5-10,monthlyOvertimeSpend,420,1680,4200
HVAC,11-20,annualRevenue,4166400,5208000,6510000
HVAC,11-20,avgMonthlyRevenuePerTeamMember,22400,28000,35000
HVAC,11-20,laborRate,33,40,48
HVAC,11-20,avgJobValue,368,525,788
HVAC,11-20,billableEfficiency,26,36,48
HVAC,11-20,callbackRate,2,4,6
HVAC,11-20,avgGoogleRating,4,4,5
HVAC,11-20,monthlyOvertimeSpend,573,2295,5738
HVAC,21-50,annualRevenue,10894827,13618533,17023167
HVAC,21-50,avgMonthlyRevenuePerTeamMember,25511,31889,39861
HVAC,21-50,laborRate,31,38,46
HVAC,21-50,avgJobValue,385,550,825
HVAC,21-50,billableEfficiency,28,38,50
HVAC,21-50,callbackRate,2,3,6
HVAC,21-50,avgGoogleRating,4,5,5
HVAC,21-50,monthlyOvertimeSpend,1729,6918,17295
HVAC,51-100,annualRevenue,24906667,31133333,38916667
HVAC,51-100,avgMonthlyRevenuePerTeamMember,27556,34444,43056
HVAC,51-100,laborRate,30,37,45
HVAC,51-100,avgJobValue,420,600,900
HVAC,51-100,billableEfficiency,30,40,52
HVAC,51-100,callbackRate,2,3,6
HVAC,51-100,avgGoogleRating,4,5,5
HVAC,51-100,monthlyOvertimeSpend,3113,12453,31133
HVAC,101-250,annualRevenue,60809600,76012000,95015000
HVAC,101-250,avgMonthlyRevenuePerTeamMember,28889,36111,45139
HVAC,101-250,laborRate,28,35,43
HVAC,101-250,avgJobValue,455,650,975
HVAC,101-250,billableEfficiency,31,41,53
HVAC,101-250,callbackRate,1,3,5
HVAC,101-250,avgGoogleRating,4,5,5
HVAC,101-250,monthlyOvertimeSpend,4444,17736,44340
HVAC,251-500,annualRevenue,154156000,192695000,240868750
HVAC,251-500,avgMonthlyRevenuePerTeamMember,34222,42778,53472
HVAC,251-500,laborRate,27,34,42
HVAC,251-500,avgJobValue,490,700,1050
HVAC,251-500,billableEfficiency,32,42,54
HVAC,251-500,callbackRate,1,3,5
HVAC,251-500,avgGoogleRating,4,5,5
HVAC,251-500,monthlyOvertimeSpend,4336,17342,43355
HVAC,501-1000,annualRevenue,308712000,385890000,482362500
HVAC,501-1000,avgMonthlyRevenuePerTeamMember,34222,42778,53472
HVAC,501-1000,laborRate,26,33,41
HVAC,501-1000,avgJobValue,508,725,1088
HVAC,501-1000,billableEfficiency,33,43,55
HVAC,501-1000,callbackRate,1,3,5
HVAC,501-1000,avgGoogleRating,4,5,5
HVAC,501-1000,monthlyOvertimeSpend,4180,16718,41797
HVAC,1000+,annualRevenue,616000000,770000000,962500000
HVAC,1000+,avgMonthlyRevenuePerTeamMember,34222,42778,53472
HVAC,1000+,laborRate,25,32,40
HVAC,1000+,avgJobValue,525,750,1125
HVAC,1000+,billableEfficiency,34,44,56
HVAC,1000+,callbackRate,1,2,5
HVAC,1000+,avgGoogleRating,4,5,5
HVAC,1000+,monthlyOvertimeSpend,3417,13667,34167
Plumbing,5-10,annualRevenue,1065600,1332000,1665000
Plumbing,5-10,avgMonthlyRevenuePerTeamMember,11840,14800,18500
Plumbing,5-10,laborRate,36,43,51
Plumbing,5-10,avgJobValue,315,450,675
Plumbing,5-10,billableEfficiency,24,34,46
Plumbing,5-10,callbackRate,3,4,6
Plumbing,5-10,avgGoogleRating,4,4,5
Plumbing,5-10,monthlyOvertimeSpend,239,954,2385
Plumbing,11-20,annualRevenue,2316384,2895480,3619350
Plumbing,11-20,avgMonthlyRevenuePerTeamMember,12444,15556,19444
Plumbing,11-20,laborRate,34,41,49
Plumbing,11-20,avgJobValue,332,475,712
Plumbing,11-20,billableEfficiency,26,36,48
Plumbing,11-20,callbackRate,2,4,6
Plumbing,11-20,avgGoogleRating,4,4,5
Plumbing,11-20,monthlyOvertimeSpend,330,1318,3298
Plumbing,21-50,annualRevenue,6061509,7576887,9471109
Plumbing,21-50,avgMonthlyRevenuePerTeamMember,14169,17711,22139
Plumbing,21-50,laborRate,33,40,48
Plumbing,21-50,avgJobValue,350,500,750
Plumbing,21-50,billableEfficiency,28,38,50
Plumbing,21-50,callbackRate,2,3,6
Plumbing,21-50,avgGoogleRating,4,5,5
Plumbing,21-50,monthlyOvertimeSpend,1010,4041,10103
Plumbing,51-100,annualRevenue,13867333,17334167,21667708
Plumbing,51-100,avgMonthlyRevenuePerTeamMember,15311,19139,23924
Plumbing,51-100,laborRate,32,39,47
Plumbing,51-100,avgJobValue,385,550,825
Plumbing,51-100,billableEfficiency,30,40,52
Plumbing,51-100,callbackRate,2,3,6
Plumbing,51-100,avgGoogleRating,4,5,5
Plumbing,51-100,monthlyOvertimeSpend,1877,7508,18771
Plumbing,101-250,annualRevenue,33890304,42362880,52953600
Plumbing,101-250,avgMonthlyRevenuePerTeamMember,16049,20062,25077
Plumbing,101-250,laborRate,30,37,45
Plumbing,101-250,avgJobValue,420,600,900
Plumbing,101-250,billableEfficiency,31,41,53
Plumbing,101-250,callbackRate,2,3,5
Plumbing,101-250,avgGoogleRating,4,5,5
Plumbing,101-250,monthlyOvertimeSpend,2612,10447,26117
Plumbing,251-500,annualRevenue,85838800,107298500,134123125
Plumbing,251-500,avgMonthlyRevenuePerTeamMember,19000,23750,29688
Plumbing,251-500,laborRate,29,36,44
Plumbing,251-500,avgJobValue,438,625,938
Plumbing,251-500,billableEfficiency,32,42,54
Plumbing,251-500,callbackRate,1,3,5
Plumbing,251-500,avgGoogleRating,4,5,5
Plumbing,251-500,monthlyOvertimeSpend,2575,10300,25752
Plumbing,501-1000,annualRevenue,171485600,214357000,267946250
Plumbing,501-1000,avgMonthlyRevenuePerTeamMember,19000,23750,29688
Plumbing,501-1000,laborRate,28,35,43
Plumbing,501-1000,avgJobValue,455,650,975
Plumbing,501-1000,billableEfficiency,33,43,55
Plumbing,501-1000,callbackRate,1,3,5
Plumbing,501-1000,avgGoogleRating,4,5,5
Plumbing,501-1000,monthlyOvertimeSpend,2502,10008,25021
Plumbing,1000+,annualRevenue,342000000,427500000,534375000
Plumbing,1000+,avgMonthlyRevenuePerTeamMember,19000,23750,29688
Plumbing,1000+,laborRate,27,34,42
Plumbing,1000+,avgJobValue,490,700,1050
Plumbing,1000+,billableEfficiency,34,44,56
Plumbing,1000+,callbackRate,1,2,5
Plumbing,1000+,avgGoogleRating,4,5,5
Plumbing,1000+,monthlyOvertimeSpend,2019,8075,20188
Electrical,5-10,annualRevenue,1223040,1528800,1911000
Electrical,5-10,avgMonthlyRevenuePerTeamMember,13589,16986,21233
Electrical,5-10,laborRate,35,42,50
Electrical,5-10,avgJobValue,368,525,788
Electrical,5-10,billableEfficiency,24,34,46
Electrical,5-10,callbackRate,3,4,7
Electrical,5-10,avgGoogleRating,4,4,5
Electrical,5-10,monthlyOvertimeSpend,268,1073,2680
Electrical,11-20,annualRevenue,2655456,3319320,4149150
Electrical,11-20,avgMonthlyRevenuePerTeamMember,14276,17845,22306
Electrical,11-20,laborRate,33,40,48
Electrical,11-20,avgJobValue,385,550,825
Electrical,11-20,billableEfficiency,26,36,48
Electrical,11-20,callbackRate,2,4,7
Electrical,11-20,avgGoogleRating,4,4,5
Electrical,11-20,monthlyOvertimeSpend,368,1472,3677
Electrical,21-50,annualRevenue,6945603,8682004,10852505
Electrical,21-50,avgMonthlyRevenuePerTeamMember,16258,20322,25403
Electrical,21-50,laborRate,31,38,46
Electrical,21-50,avgJobValue,402,575,862
Electrical,21-50,billableEfficiency,28,38,50
Electrical,21-50,callbackRate,2,4,8
Electrical,21-50,avgGoogleRating,4,5,5
Electrical,21-50,monthlyOvertimeSpend,1100,4398,10995
Electrical,51-100,annualRevenue,15888667,19860833,24826042
Electrical,51-100,avgMonthlyRevenuePerTeamMember,17588,21985,27481
Electrical,51-100,laborRate,30,37,45
Electrical,51-100,avgJobValue,438,625,938
Electrical,51-100,billableEfficiency,30,40,52
Electrical,51-100,callbackRate,2,4,8
Electrical,51-100,avgGoogleRating,4,5,5
Electrical,51-100,monthlyOvertimeSpend,2456,9826,24564
Electrical,101-250,annualRevenue,38849856,48562320,60702900
Electrical,101-250,avgMonthlyRevenuePerTeamMember,18435,23044,28805
Electrical,101-250,laborRate,28,35,43
Electrical,101-250,avgJobValue,472,675,1012
Electrical,101-250,billableEfficiency,31,41,53
Electrical,101-250,callbackRate,2,3,7
Electrical,101-250,avgGoogleRating,4,5,5
Electrical,101-250,monthlyOvertimeSpend,2833,11332,28331
Electrical,251-500,annualRevenue,98415200,123019000,153773750
Electrical,251-500,avgMonthlyRevenuePerTeamMember,21800,27250,34062
Electrical,251-500,laborRate,27,34,42
Electrical,251-500,avgJobValue,508,725,1088
Electrical,251-500,billableEfficiency,32,42,54
Electrical,251-500,callbackRate,1,3,7
Electrical,251-500,avgGoogleRating,4,5,5
Electrical,251-500,monthlyOvertimeSpend,2794,11175,27943
Electrical,501-1000,annualRevenue,196664400,245830500,307288125
Electrical,501-1000,avgMonthlyRevenuePerTeamMember,21800,27250,34062
Electrical,501-1000,laborRate,26,33,41
Electrical,501-1000,avgJobValue,536,765,1148
Electrical,501-1000,billableEfficiency,33,43,55
Electrical,501-1000,callbackRate,1,3,6
Electrical,501-1000,avgGoogleRating,4,5,5
Electrical,501-1000,monthlyOvertimeSpend,2674,10695,26738
Electrical,1000+,annualRevenue,392000000,490000000,612500000
Electrical,1000+,avgMonthlyRevenuePerTeamMember,21800,27250,34062
Electrical,1000+,laborRate,25,32,40
Electrical,1000+,avgJobValue,560,800,1200
Electrical,1000+,billableEfficiency,34,44,56
Electrical,1000+,callbackRate,1,3,6
Electrical,1000+,avgGoogleRating,4,5,5
Electrical,1000+,monthlyOvertimeSpend,2613,10453,26133
Roofing,5-10,annualRevenue,1080000,1350000,1687500
Roofing,5-10,avgMonthlyRevenuePerTeamMember,16000,20000,25000
Roofing,5-10,laborRate,33,40,48
Roofing,5-10,avgJobValue,4950,9000,16200
Roofing,5-10,billableEfficiency,24,34,46
Roofing,5-10,callbackRate,2,3,5
Roofing,5-10,avgGoogleRating,4,4,5
Roofing,5-10,monthlyOvertimeSpend,225,900,2250
Roofing,11-20,annualRevenue,3123120,3903900,4879875
Roofing,11-20,avgMonthlyRevenuePerTeamMember,16800,21000,26250
Roofing,11-20,laborRate,31,38,46
Roofing,11-20,avgJobValue,5225,9500,17100
Roofing,11-20,billableEfficiency,26,36,48
Roofing,11-20,callbackRate,2,3,5
Roofing,11-20,avgGoogleRating,4,4,5
Roofing,11-20,monthlyOvertimeSpend,247,988,2469
Roofing,21-50,annualRevenue,6515120,8143900,10179875
Roofing,21-50,avgMonthlyRevenuePerTeamMember,19133,23917,29896
Roofing,21-50,laborRate,29,36,44
Roofing,21-50,avgJobValue,5775,10500,18900
Roofing,21-50,billableEfficiency,28,38,50
Roofing,21-50,callbackRate,1,2,5
Roofing,21-50,avgGoogleRating,4,5,5
Roofing,21-50,monthlyOvertimeSpend,611,2446,6113
Roofing,51-100,annualRevenue,14904800,18631000,23288750
Roofing,51-100,avgMonthlyRevenuePerTeamMember,20667,25833,32292
Roofing,51-100,laborRate,28,35,43
Roofing,51-100,avgJobValue,6325,11500,20700
Roofing,51-100,billableEfficiency,30,40,52
Roofing,51-100,callbackRate,1,2,4
Roofing,51-100,avgGoogleRating,4,5,5
Roofing,51-100,monthlyOvertimeSpend,543,2174,5434
Roofing,101-250,annualRevenue,36468000,45585000,56981250
Roofing,101-250,avgMonthlyRevenuePerTeamMember,21667,27083,33854
Roofing,101-250,laborRate,26,33,41
Roofing,101-250,avgJobValue,6875,12500,22500
Roofing,101-250,billableEfficiency,31,41,53
Roofing,101-250,callbackRate,1,2,4
Roofing,101-250,avgGoogleRating,4,5,5
Roofing,101-250,monthlyOvertimeSpend,627,2507,6268
Roofing,251-500,annualRevenue,92492000,115615000,144518750
Roofing,251-500,avgMonthlyRevenuePerTeamMember,25667,32083,40104
Roofing,251-500,laborRate,25,32,40
Roofing,251-500,avgJobValue,7425,13500,24300
Roofing,251-500,billableEfficiency,32,42,54
Roofing,251-500,callbackRate,0,2,4
Roofing,251-500,avgGoogleRating,4,5,5
Roofing,251-500,monthlyOvertimeSpend,771,3083,7708
Roofing,501-1000,annualRevenue,184984000,231230000,289037500
Roofing,501-1000,avgMonthlyRevenuePerTeamMember,25667,32083,40104
Roofing,501-1000,laborRate,24,31,39
Roofing,501-1000,avgJobValue,7975,14500,26100
Roofing,501-1000,billableEfficiency,33,43,55
Roofing,501-1000,callbackRate,0,2,4
Roofing,501-1000,avgGoogleRating,4,5,5
Roofing,501-1000,monthlyOvertimeSpend,747,2989,7473
Roofing,1000+,annualRevenue,369600000,462000000,577500000
Roofing,1000+,avgMonthlyRevenuePerTeamMember,25667,32083,40104
Roofing,1000+,laborRate,23,30,38
Roofing,1000+,avgJobValue,8250,15000,27000
Roofing,1000+,billableEfficiency,34,44,56
Roofing,1000+,callbackRate,0,2,4
Roofing,1000+,avgGoogleRating,4,5,5
Roofing,1000+,monthlyOvertimeSpend,577,2305,5769`;

function mapMetric(metric: string): InternalMetricName | null {
  switch (metric) {
    case "annualRevenue":
      return "annualRevenue";
    case "avgMonthlyRevenuePerTeamMember":
      return "monthlyRevenuePerMember";
    case "laborRate":
      return "laborRate";
    case "avgJobValue":
      return "avgJobValue";
    case "billableEfficiency":
      return "billableEfficiency";
    case "callbackRate":
      return "callbackRate";
    case "avgGoogleRating":
      return "googleRating";
    case "monthlyOvertimeSpend":
      return "monthlyOvertimeSpend";
    default:
      return null;
  }
}

function parseCsvRows(csv: string): CsvRow[] {
  const lines = csv.trim().split("\n");
  const rows = lines.slice(1);
  return rows.map((line) => {
    const [industry, teamSizeBand, metric, lower, median, upper] = line.split(",");
    return {
      industry: industry.trim(),
      teamSizeBand: teamSizeBand.trim() as TeamSizeBand,
      metric: metric.trim(),
      lower: Number(lower),
      median: Number(median),
      upper: Number(upper),
    };
  });
}

function formatMetricValue(name: InternalMetricName, value: number): string {
  const meta = METRIC_META[name];
  if (meta.unit === "currency" || meta.unit === "currencyPerMonth") {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
    return `$${Math.round(value).toLocaleString()}`;
  }
  if (meta.unit === "percentage") {
    return `${value}${meta.suffix ?? "%"}`;
  }
  if (meta.unit === "rating") {
    return Number.isInteger(value) ? `${value}` : value.toFixed(1);
  }
  return `${value}`;
}

function buildDescription(
  industry: string,
  band: TeamSizeBand,
  name: InternalMetricName,
  lower: number,
  median: number,
  upper: number
): RichDescription {
  const display = METRIC_META[name].displayName.toLowerCase();
  return [
    [
      { text: `For ${industry} companies with ${band} team members, the median ${display} is ` },
      { text: `${formatMetricValue(name, median)}.`, color: "green" },
    ],
    [{ text: `Typical range runs from ${formatMetricValue(name, lower)} to ${formatMetricValue(name, upper)}.` }],
  ];
}

function buildCatalog(rows: CsvRow[]): BenchmarkCatalog {
  return rows.reduce<BenchmarkCatalog>((acc, row) => {
  const mappedMetric = mapMetric(row.metric);
  if (!mappedMetric) return acc;

  if (!acc[row.industry]) acc[row.industry] = {};
  if (!acc[row.industry][row.teamSizeBand]) acc[row.industry][row.teamSizeBand] = {};

  acc[row.industry][row.teamSizeBand]![mappedMetric] = row;
  return acc;
}, {});
}

const defaultCatalog = buildCatalog(parseCsvRows(RAW_BENCHMARK_CSV));
const catalogCache = new Map<string, BenchmarkCatalog>();

export function getTeamSizeBand(teamSize: number): TeamSizeBand {
  if (teamSize <= 10) return "5-10";
  if (teamSize <= 20) return "11-20";
  if (teamSize <= 50) return "21-50";
  if (teamSize <= 100) return "51-100";
  if (teamSize <= 250) return "101-250";
  if (teamSize <= 500) return "251-500";
  if (teamSize <= 1000) return "501-1000";
  return "1000+";
}

function resolveIndustry(catalog: BenchmarkCatalog, inputIndustry?: string): string {
  if (!inputIndustry) return "HVAC";
  return catalog[inputIndustry] ? inputIndustry : "HVAC";
}

function resolveBand(
  catalog: BenchmarkCatalog,
  industry: string,
  requestedBand: TeamSizeBand
): TeamSizeBand {
  const industryBands = catalog[industry] ?? {};
  if (industryBands[requestedBand]) return requestedBand;

  for (const band of BAND_ORDER) {
    if (industryBands[band]) return band;
  }

  return "11-20";
}

function resolveCatalog(csvText?: string): BenchmarkCatalog {
  if (!csvText || !csvText.trim()) return defaultCatalog;
  const cached = catalogCache.get(csvText);
  if (cached) return cached;

  const built = buildCatalog(parseCsvRows(csvText));
  catalogCache.set(csvText, built);
  return built;
}

export function resolveBenchmarksForIndustryAndTeamSize(
  industry?: string,
  teamSize?: number,
  csvText?: string
): BenchmarkMetric[] {
  const catalog = resolveCatalog(csvText);
  const resolvedIndustry = resolveIndustry(catalog, industry);
  const requestedBand = getTeamSizeBand(teamSize && teamSize > 0 ? teamSize : 12);
  const resolvedBand = resolveBand(catalog, resolvedIndustry, requestedBand);
  const bandRows = catalog[resolvedIndustry]?.[resolvedBand] ?? {};

  return METRIC_ORDER.flatMap((metricName) => {
    const row = bandRows[metricName];
    if (!row) return [];

    const meta = METRIC_META[metricName];

    return [
      {
        name: metricName,
        displayName: meta.displayName,
        description: buildDescription(
          resolvedIndustry,
          resolvedBand,
          metricName,
          row.lower,
          row.median,
          row.upper
        ),
        lower: row.lower,
        median: row.median,
        upper: row.upper,
        unit: meta.unit,
        prefix: meta.prefix,
        suffix: meta.suffix,
        invertedScale: meta.invertedScale,
      },
    ];
  });
}
