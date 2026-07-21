import { describe, expect, it } from "vitest";
import { formatCompactNumber } from "./format";

describe("formatCompactNumber", () => {
  it("leaves numbers with fewer than 6 digits grouped", () => {
    expect(formatCompactNumber(0)).toBe("0");
    expect(formatCompactNumber(500)).toBe("500");
    expect(formatCompactNumber(99_000)).toBe("99,000");
    expect(formatCompactNumber(99_999)).toBe("99,999");
  });

  it("abbreviates the thousands group with K from 6 digits", () => {
    expect(formatCompactNumber(100_000)).toBe("100K");
    expect(formatCompactNumber(105_000)).toBe("105K");
    expect(formatCompactNumber(137_500)).toBe("137K5");
    expect(formatCompactNumber(137_550)).toBe("137K55");
    expect(formatCompactNumber(137_555)).toBe("137K555");
    expect(formatCompactNumber(100_005)).toBe("100K005");
    expect(formatCompactNumber(999_999)).toBe("999K999");
  });

  it("abbreviates the millions group with M from 7 digits", () => {
    expect(formatCompactNumber(1_000_000)).toBe("1M");
    expect(formatCompactNumber(5_000_000)).toBe("5M");
    expect(formatCompactNumber(1_500_000)).toBe("1M5");
    expect(formatCompactNumber(2_500_000)).toBe("2M5");
    expect(formatCompactNumber(9_999_999)).toBe("9M999999");
    expect(formatCompactNumber(12_500_000)).toBe("12M5");
    expect(formatCompactNumber(12_345_678)).toBe("12M345678");
  });

  it("abbreviates the billions group with B from 10 digits", () => {
    expect(formatCompactNumber(1_000_000_000)).toBe("1B");
    expect(formatCompactNumber(2_500_000_000)).toBe("2B5");
    expect(formatCompactNumber(999_999_999)).toBe("999M999999");
  });

  it("abbreviates the trillions group with T from 13 digits", () => {
    expect(formatCompactNumber(1_000_000_000_000)).toBe("1T");
    expect(formatCompactNumber(3_500_000_000_000)).toBe("3T5");
    expect(formatCompactNumber(999_999_999_999)).toBe("999B999999999");
  });

  it("handles negatives", () => {
    expect(formatCompactNumber(-137_500)).toBe("-137K5");
    expect(formatCompactNumber(-5_000)).toBe("-5,000");
  });
});
