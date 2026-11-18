import { describe, expect, it } from "vitest";
import { canSee, csvRecords, handleProblem, linkedinDay, linkedinSlug, linksBack, normalizeLink, parseCsv, readLinkedin, relMeLinks, sectionAudience } from "./profile";

describe("handles", () => {
  it("takes letters, digits and hyphens, 3 to 30, not reserved", () => {
    expect(handleProblem("anaruiz")).toBeNull();
    expect(handleProblem("@Ana-Ruiz")).toBeNull();
    expect(handleProblem("ab")).toMatch(/at least 3/);
    expect(handleProblem("-ana")).toMatch(/letters/);
    expect(handleProblem("ana ruiz")).toMatch(/letters/);
    expect(handleProblem("settings")).toMatch(/reserved/);
    expect(handleProblem("a".repeat(31))).toMatch(/at most 30/);
  });
});

describe("audiences", () => {
  it("shows a part to the owner always, to met people when set to met, to anyone when set to everyone", () => {
    expect(canSee("me", "owner")).toBe(true);
    expect(canSee("me", "met")).toBe(false);
    expect(canSee("met", "met")).toBe(true);
    expect(canSee("met", "signed-in")).toBe(false);
    expect(canSee("everyone", "anyone")).toBe(true);
    expect(sectionAudience("experience", { experience: "everyone" }, "met")).toBe("everyone");
    expect(sectionAudience("experience", { experience: "nobody" }, "met")).toBe("met");
  });
});

describe("links", () => {
  it("recognises services from links and handles", () => {
    expect(normalizeLink("https://www.linkedin.com/in/Ana-Ruiz/?trk=x")).toEqual({ service: "linkedin", url: "https://www.linkedin.com/in/ana-ruiz", handle: "ana-ruiz" });
    expect(normalizeLink("anaruiz", "github")).toEqual({ service: "github", url: "https://github.com/anaruiz", handle: "anaruiz" });
    expect(normalizeLink("twitter.com/anaruiz")).toEqual({ service: "x", url: "https://twitter.com/anaruiz", handle: "anaruiz" });
    expect(normalizeLink("https://mastodon.social/@ana")).toEqual({ service: "mastodon", url: "https://mastodon.social/@ana", handle: "ana" });
    expect(normalizeLink("anaruiz.com")?.service).toBe("website");
    expect(normalizeLink("not a link")).toBeNull();
    expect(normalizeLink("javascript:alert(1)")).toBeNull();
  });

  it("reads LinkedIn slugs", () => {
    expect(linkedinSlug("https://www.linkedin.com/in/ana%2Druiz")).toBe("ana-ruiz");
    expect(linkedinSlug("https://example.com/in/ana")).toBeNull();
  });

  it("finds rel=me links and whether one points back at the profile", () => {
    const html = `<a href="https://x.com/a">x</a><a rel="nofollow me" href="https://reflect.example/p/anaruiz">me</a><link rel=me href='https://reflect.example/p/u_1'>`;
    const hrefs = relMeLinks(html);
    expect(hrefs).toEqual(["https://reflect.example/p/anaruiz", "https://reflect.example/p/u_1"]);
    expect(linksBack(hrefs, ["reflect.example"], ["anaruiz"])).toBe(true);
    expect(linksBack(hrefs, ["other.example"], ["anaruiz"])).toBe(false);
    expect(linksBack(["https://reflect.example/p/someone"], ["reflect.example"], ["anaruiz", "u_9"])).toBe(false);
  });
});

describe("LinkedIn export", () => {
  it("parses quoted CSV and skips the notes before the header", () => {
    expect(parseCsv('a,"b, c","d ""q"""\n1,2,3')).toEqual([["a", "b, c", 'd "q"'], ["1", "2", "3"]]);
    const text = 'Notes:\n"When exporting your connection data, you may notice..."\n\nFirst Name,Last Name,URL\nBo,Lee,https://www.linkedin.com/in/bolee\n';
    expect(csvRecords(text, "First Name")).toEqual([{ "First Name": "Bo", "Last Name": "Lee", URL: "https://www.linkedin.com/in/bolee" }]);
  });

  it("reads positions, schools, skills, connections and the headline, never the address or birth date", () => {
    const out = readLinkedin({
      "Positions.csv": "Company Name,Title,Description,Location,Started On,Finished On\nEasy Tiger,Head baker,,Austin,Jan 2021,Mar 2025\n",
      "Education.csv": "School Name,Start Date,End Date,Notes,Degree Name,Activities\nUT Austin,2017,2021,,BS Nutrition,\n",
      "Skills.csv": "Name\nBaking\nBaking\nFermentation\n",
      "Connections.csv": "Notes:\nx\n\nFirst Name,Last Name,URL,Email Address,Company,Position,Connected On\nBo,Lee,https://www.linkedin.com/in/BoLee,,Acme,CEO,12 Mar 2023\nNo,Url,,,,,\n",
      "Profile.csv": "First Name,Last Name,Maiden Name,Address,Birth Date,Headline,Summary\nAna,Ruiz,,1 Main St,Jan 1 1990,Baker,\n",
    });
    expect(out.positions).toEqual([{ kind: "position", organisation: "Easy Tiger", title: "Head baker", starts: "Jan 2021", ends: "Mar 2025" }]);
    expect(out.schools).toEqual([{ kind: "school", organisation: "UT Austin", title: "BS Nutrition", starts: "2017", ends: "2021" }]);
    expect(out.skills).toEqual(["Baking", "Fermentation"]);
    expect(out.connections).toEqual([{ name: "Bo Lee", slug: "bolee", company: "Acme", position: "CEO", connectedOn: "2023-03-12" }]);
    expect(out.headline).toBe("Baker");
    expect(JSON.stringify(out)).not.toMatch(/Main St|1990/);
  });

  it("reads LinkedIn dates", () => {
    expect(linkedinDay("12 Mar 2023")).toBe("2023-03-12");
    expect(linkedinDay("2023-03-12")).toBe("2023-03-12");
    expect(linkedinDay("soon")).toBeNull();
  });
});
