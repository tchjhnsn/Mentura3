// The published figures the household plan estimates from (doc "Already and Not yet design guide", Income plan).
// Each table names its source and the date it was read. Only sources that were opened and checked are here; the
// guide's other sources (HUD rents, home and land values, childcare prices, health premiums, state taxes) are not
// built yet, and their costs come from the person's own figures.

export type Source = { name: string; url: string; asOf: string };

/**
 * USDA Food Plans, cost of food at home a month, U.S. average, October 2026 (issued November 2026). Thrifty from
 * the Thrifty Food Plan report; low, moderate and liberal from the three-level report. Adults are women and men
 * 19 or 20 to 50; children are the five child groups, from 1 year to 9 to 11 years.
 */
export const FOOD_PLANS = {
  source: { name: "USDA Food Plans, October 2026", url: "https://www.fns.usda.gov/research/cnpp/usda-food-plans/cost-food-monthly-reports", asOf: "2026-11-17" } satisfies Source,
  levels: {
    thrifty: { label: "Thrifty", woman: 254.2, man: 319.1, children: [114.2, 172.6, 188.5, 209.3, 242.0] },
    low: { label: "Low-cost", woman: 277.0, man: 318.5, children: [165.8, 173.8, 179.5, 262.1, 271.4] },
    moderate: { label: "Moderate-cost", woman: 337.0, man: 398.9, children: [186.9, 207.7, 222.4, 305.6, 351.2] },
    liberal: { label: "Liberal", woman: 430.2, man: 486.8, children: [227.1, 252.8, 268.8, 357.8, 409.8] },
  },
  /** The report's adjustment for household size: costs are for members of a four-person household. */
  sizeFactor: (n: number) => (n <= 1 ? 1.2 : n === 2 ? 1.1 : n === 3 ? 1.05 : n === 4 ? 1 : n <= 6 ? 0.95 : 0.9),
} as const;
export type FoodLevel = keyof typeof FOOD_PLANS.levels;
export const FOOD_LEVELS = Object.keys(FOOD_PLANS.levels) as FoodLevel[];

/**
 * Federal income tax for tax year 2026 (IRS, inflation adjustments for 2026 including the One Big Beautiful Bill):
 * the standard deduction and the brackets, single and married filing jointly. Credits are not counted.
 */
export const FEDERAL_TAX = {
  source: { name: "IRS, tax year 2026", url: "https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill", asOf: "2026-11-17" } satisfies Source,
  single: { deduction: 16_100, brackets: [[0, 0.1], [12_400, 0.12], [50_400, 0.22], [105_700, 0.24], [201_775, 0.32], [256_225, 0.35], [640_600, 0.37]] as const },
  joint: { deduction: 32_200, brackets: [[0, 0.1], [24_800, 0.12], [100_800, 0.22], [211_400, 0.24], [403_550, 0.32], [512_450, 0.35], [768_700, 0.37]] as const },
} as const;

/** The employee's share of Social Security (6.2%) and Medicare (1.45%) on wages; the Social Security wage cap is not applied. */
export const PAYROLL = { rate: 0.0765, source: { name: "SSA, FICA rates", url: "https://www.ssa.gov/oact/progdata/taxRates.html", asOf: "2026-11-17" } satisfies Source } as const;
