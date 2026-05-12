import { describe, expect, it } from "vitest";
import { CRISIS_RESOURCES, detectRegion } from "./crisis-resources";

describe("detectRegion", () => {
  it("maps en-US and en-CA to us_ca", () => {
    expect(detectRegion("en-US")).toBe("us_ca");
    expect(detectRegion("en-CA")).toBe("us_ca");
    expect(detectRegion("fr-CA")).toBe("us_ca");
  });

  it("maps en-GB and en-IE to uk_ie", () => {
    expect(detectRegion("en-GB")).toBe("uk_ie");
    expect(detectRegion("en-IE")).toBe("uk_ie");
  });

  it("maps en-AU and en-NZ to au_nz", () => {
    expect(detectRegion("en-AU")).toBe("au_nz");
    expect(detectRegion("en-NZ")).toBe("au_nz");
  });

  it("returns international for languages without a country suffix", () => {
    expect(detectRegion("en")).toBe("international");
    expect(detectRegion("es")).toBe("international");
  });

  it("returns international for unrecognized country codes", () => {
    expect(detectRegion("fr-FR")).toBe("international");
    expect(detectRegion("ja-JP")).toBe("international");
    expect(detectRegion("pt-BR")).toBe("international");
  });

  it("returns international for missing / empty input", () => {
    expect(detectRegion(undefined)).toBe("international");
    expect(detectRegion(null)).toBe("international");
    expect(detectRegion("")).toBe("international");
  });

  it("is case-insensitive", () => {
    expect(detectRegion("EN-us")).toBe("us_ca");
    expect(detectRegion("en-Gb")).toBe("uk_ie");
  });
});

describe("CRISIS_RESOURCES catalog", () => {
  it("has at least one phone- or text- reachable line per region (except international)", () => {
    for (const key of ["us_ca", "uk_ie", "au_nz"] as const) {
      const reachable = CRISIS_RESOURCES[key].resources.filter((r) => r.phone || r.text);
      expect(reachable.length, `${key} must have ≥1 reachable line`).toBeGreaterThan(0);
    }
  });

  it("international block uses URL pointers, not regional phone numbers", () => {
    for (const resource of CRISIS_RESOURCES.international.resources) {
      expect(resource.url).toBeTruthy();
    }
  });
});
