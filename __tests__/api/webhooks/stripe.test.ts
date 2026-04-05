import { vi, describe, it, expect, beforeEach } from "vitest";
import { POST } from "@/app/api/webhooks/stripe/route";

vi.mock("@/lib/supabase/admin");
vi.mock("@/lib/stripe");
vi.mock("@/lib/email");

describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 500 when STRIPE_WEBHOOK_SECRET is missing", async () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");
    const req = new Request("http://localhost:3000/api/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": "test" },
      body: "{}",
    });

    const response = await POST(req);
    expect(response.status).toBe(500);
    expect(await response.text()).toContain("Missing STRIPE_WEBHOOK_SECRET");
  });

  it("returns 400 when stripe-signature header is missing", async () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
    const req = new Request("http://localhost:3000/api/webhooks/stripe", {
      method: "POST",
      body: "{}",
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    expect(await response.text()).toContain("Missing Stripe signature");
  });

  it("returns 400 on invalid webhook signature", async () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");

    const { getStripe } = await import("@/lib/stripe");
    vi.mocked(getStripe).mockReturnValue({
      webhooks: {
        constructEvent: vi.fn().mockImplementation(() => {
          throw new Error("Invalid signature");
        }),
      },
    } as ReturnType<typeof getStripe>);

    const req = new Request("http://localhost:3000/api/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": "invalid" },
      body: "{}",
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    expect(await response.text()).toContain("Invalid webhook");
  });
});
