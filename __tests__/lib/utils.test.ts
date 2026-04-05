import { vi } from "vitest";
import {
  formatZAR,
  calculateVatCents,
  calculateTotalIncludingVatCents,
  slugify,
  normalizeRemoteImageUrl,
  generateOrderNumber,
  SOUTH_AFRICAN_VAT_RATE,
} from "@/lib/utils";

describe("formatZAR", () => {
  it("formats zero correctly", () => {
    expect(formatZAR(0)).toMatch(/R\s*0[,.]?0{1,2}/);
  });

  it("formats a whole-rand value (100 cents = R1)", () => {
    const result = formatZAR(100);
    expect(result).toContain("1");
    expect(result).toMatch(/R/);
  });

  it("formats 9999 cents as ~R99.99", () => {
    const result = formatZAR(9999);
    expect(result).toContain("99");
  });

  it("formats a large value without throwing", () => {
    expect(() => formatZAR(1_000_000_00)).not.toThrow();
  });

  it("formats negative values (refund scenario)", () => {
    const result = formatZAR(-100);
    expect(result).toMatch(/-/);
  });

  it("divides by 100 before formatting", () => {
    const result = formatZAR(10000);
    expect(result).toContain("100");
  });
});

describe("calculateVatCents", () => {
  it("uses 15% as the default rate", () => {
    expect(calculateVatCents(1000)).toBe(150);
  });

  it("accepts a custom rate", () => {
    expect(calculateVatCents(1000, 0.1)).toBe(100);
  });

  it("rounds half-up (Math.round semantics)", () => {
    expect(calculateVatCents(1)).toBe(0);
    expect(calculateVatCents(4)).toBe(1);
  });

  it("returns 0 for a 0 input", () => {
    expect(calculateVatCents(0)).toBe(0);
  });

  it("correctly computes VAT on a common price (R199.99 = 19999 cents)", () => {
    expect(calculateVatCents(19999)).toBe(3000);
  });

  it("handles the SOUTH_AFRICAN_VAT_RATE constant (0.15)", () => {
    expect(SOUTH_AFRICAN_VAT_RATE).toBe(0.15);
    expect(calculateVatCents(100, SOUTH_AFRICAN_VAT_RATE)).toBe(15);
  });
});

describe("calculateTotalIncludingVatCents", () => {
  it("adds VAT to the base amount at 15%", () => {
    expect(calculateTotalIncludingVatCents(1000)).toBe(1150);
  });

  it("uses a custom rate", () => {
    expect(calculateTotalIncludingVatCents(1000, 0.1)).toBe(1100);
  });

  it("returns the same value as base + calculateVatCents", () => {
    const base = 7350;
    expect(calculateTotalIncludingVatCents(base)).toBe(base + calculateVatCents(base));
  });

  it("returns 0 for 0 input", () => {
    expect(calculateTotalIncludingVatCents(0)).toBe(0);
  });

  it("handles rounding correctly when VAT has fractional cents", () => {
    expect(calculateTotalIncludingVatCents(3)).toBe(3);
    expect(calculateTotalIncludingVatCents(7)).toBe(8);
  });
});

describe("slugify", () => {
  it("lowercases the input", () => {
    expect(slugify("HELLO")).toBe("hello");
  });

  it("replaces spaces with hyphens", () => {
    expect(slugify("hello world")).toBe("hello-world");
  });

  it("replaces multiple consecutive non-alphanumeric characters with a single hyphen", () => {
    expect(slugify("hello   world")).toBe("hello-world");
    expect(slugify("hello---world")).toBe("hello-world");
    expect(slugify("hello & world!")).toBe("hello-world");
  });

  it("strips leading and trailing hyphens", () => {
    expect(slugify("-hello-")).toBe("hello");
    expect(slugify("  hello  ")).toBe("hello");
  });

  it("handles special characters and punctuation", () => {
    expect(slugify("It's a 100% deal!")).toBe("it-s-a-100-deal");
  });

  it("handles product names typical of an e-commerce store", () => {
    expect(slugify("Nike Air Max 270")).toBe("nike-air-max-270");
    expect(slugify("Sony WH-1000XM5 Headphones")).toBe("sony-wh-1000xm5-headphones");
  });

  it("returns an empty string for an all-special-character input", () => {
    expect(slugify("!!!")).toBe("");
  });

  it("trims surrounding whitespace before processing", () => {
    expect(slugify("  trimmed  ")).toBe("trimmed");
  });
});

describe("normalizeRemoteImageUrl", () => {
  it("returns null for null input", () => {
    expect(normalizeRemoteImageUrl(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(normalizeRemoteImageUrl(undefined)).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(normalizeRemoteImageUrl("")).toBeNull();
  });

  it("returns null for a whitespace-only string", () => {
    expect(normalizeRemoteImageUrl("   ")).toBeNull();
  });

  it("returns a valid https URL unchanged", () => {
    const url = "https://example.com/image.jpg";
    expect(normalizeRemoteImageUrl(url)).toBe(url);
  });

  it("returns a valid http URL unchanged", () => {
    const url = "http://example.com/image.png";
    expect(normalizeRemoteImageUrl(url)).toBe(url);
  });

  it("returns null for non-http/https protocols", () => {
    expect(normalizeRemoteImageUrl("ftp://example.com/file")).toBeNull();
    expect(normalizeRemoteImageUrl("data:image/png;base64,abc")).toBeNull();
    expect(normalizeRemoteImageUrl("javascript:alert(1)")).toBeNull();
  });

  it("returns null for a plain string that is not a valid URL", () => {
    expect(normalizeRemoteImageUrl("not-a-url")).toBeNull();
    expect(normalizeRemoteImageUrl("hello world")).toBeNull();
  });

  it("extracts imgurl from a Google imgres redirect", () => {
    const realUrl = "https://cdn.example.com/product.jpg";
    const googleRedirect = `https://www.google.com/imgres?imgurl=${encodeURIComponent(realUrl)}&other=stuff`;
    expect(normalizeRemoteImageUrl(googleRedirect)).toBe(realUrl);
  });

  it("extracts url param from a Google imgres redirect if imgurl is absent", () => {
    const realUrl = "https://cdn.example.com/product.jpg";
    const googleRedirect = `https://www.google.com/imgres?url=${encodeURIComponent(realUrl)}`;
    expect(normalizeRemoteImageUrl(googleRedirect)).toBe(realUrl);
  });

  it("extracts mediaurl param from a Google imgres redirect if imgurl and url are absent", () => {
    const realUrl = "https://cdn.example.com/product.jpg";
    const googleRedirect = `https://www.google.com/imgres?mediaurl=${encodeURIComponent(realUrl)}`;
    expect(normalizeRemoteImageUrl(googleRedirect)).toBe(realUrl);
  });

  it("returns null for a Google imgres URL with no nested image param", () => {
    const googleRedirect = "https://www.google.com/imgres?q=something";
    expect(normalizeRemoteImageUrl(googleRedirect)).toBeNull();
  });

  it("normalizes the URL (adds trailing slash where URL constructor does)", () => {
    const result = normalizeRemoteImageUrl("https://example.com");
    expect(result).toBe("https://example.com/");
  });

  it("handles nested Google redirect (recursive call)", () => {
    const actualUrl = "https://cdn.example.com/photo.jpg";
    const innerRedirect = `https://www.google.com/imgres?imgurl=${encodeURIComponent(actualUrl)}`;
    const outerRedirect = `https://www.google.com/imgres?imgurl=${encodeURIComponent(innerRedirect)}`;
    expect(normalizeRemoteImageUrl(outerRedirect)).toBe(actualUrl);
  });
});

describe("generateOrderNumber", () => {
  it("uses 'SB' as the default prefix", () => {
    const orderNumber = generateOrderNumber();
    expect(orderNumber).toMatch(/^SB-/);
  });

  it("accepts a custom prefix", () => {
    const orderNumber = generateOrderNumber("TEST");
    expect(orderNumber).toMatch(/^TEST-/);
  });

  it("returns an uppercase alphanumeric stamp after the prefix", () => {
    const orderNumber = generateOrderNumber();
    const [, stamp] = orderNumber.split("-");
    expect(stamp).toMatch(/^[0-9A-Z]+$/);
  });

  it("generates unique values when called with different timestamps", () => {
    const numbers = [];
    for (let i = 0; i < 5; i++) {
      vi.spyOn(Date, "now").mockReturnValue(1000000 + i);
      numbers.push(generateOrderNumber());
      vi.restoreAllMocks();
    }
    const unique = new Set(numbers);
    expect(unique.size).toBe(5);
  });

  it("has the shape PREFIX-STAMP", () => {
    const orderNumber = generateOrderNumber("INV");
    expect(orderNumber).toMatch(/^INV-[0-9A-Z]+$/);
  });
});
