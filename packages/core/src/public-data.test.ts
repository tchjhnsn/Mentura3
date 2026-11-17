import { describe, expect, it } from "vitest";
import { isState, tidyName, parseNri, placePart, waterRecord } from "./public-data";

describe("public data about where you live", () => {
  it("reads a county's rating and its hazards rated relatively high or above, highest first", () => {
    const c = parseNri({ STCOFIPS: "48453", COUNTY: "Travis", STATEABBRV: "TX", RISK_RATNG: "Relatively High", RISK_SCORE: 97.123, HAIL_RISKR: "Relatively High", IFLD_RISKR: "Very High", TRND_RISKR: "Relatively Moderate", WFIR_RISKR: "Very High", AVLN_RISKR: "Not Applicable" });
    expect(c).toMatchObject({ fips: "48453", county: "Travis", state: "TX", rating: "Relatively High", score: 97.1 });
    expect(c.hazards.map((h) => h.name)).toEqual(["Inland flooding", "Wildfire", "Hail"]);
    expect(parseNri({}).rating).toBeNull();
  });

  it("counts a water system's health-based violations in ten years, once per start day and kind", () => {
    const sys = { pwsid: "TX2270001", name: "City of Austin", served: 1_000_000 };
    const v = [
      { is_health_based_ind: "Y", compl_per_begin_date: "2022-10-15", violation_category_code: "TT" },
      { is_health_based_ind: "Y", compl_per_begin_date: "2022-10-15", violation_category_code: "TT" },
      { is_health_based_ind: "Y", compl_per_begin_date: "2019-03-01", violation_category_code: "MCL" },
      { is_health_based_ind: "N", compl_per_begin_date: "2024-01-01", violation_category_code: "MR" },
      { is_health_based_ind: "Y", compl_per_begin_date: "2010-01-01", violation_category_code: "MCL" },
    ];
    const w = waterRecord(sys, v, "2026-11-17");
    expect(w.healthBased).toBe(2);
    expect(w.latest).toEqual({ day: "2022-10-15", kind: "Treatment technique" });
    expect(waterRecord(sys, [], "2026-11-17")).toMatchObject({ healthBased: 0, latest: null });
  });

  it("fetches each part by path", () => {
    const p = { county: parseNri({ COUNTY: "Travis", STATEABBRV: "TX", RISK_RATNG: "Very High", WFIR_RISKR: "Very High" }), water: null };
    expect(placePart(p, "hazards")).toMatchObject({ county: "Travis, TX", rating: "Very High", highest: ["Wildfire (Very High)"] });
    expect(placePart(p, "")).toMatchObject({ water: null });
    expect(placePart(p, "water")).toBeNull();
    expect(placePart(p, "zz")).toBeNull();
    expect(tidyName("CITY OF AUSTIN WATER & WASTEWATER")).toBe("City of Austin Water & Wastewater");
    expect(tidyName("AQUA TEXAS WSC")).toBe("Aqua Texas WSC");
    expect(isState("TX")).toBe(true);
    expect(isState("XX")).toBe(false);
  });
});
