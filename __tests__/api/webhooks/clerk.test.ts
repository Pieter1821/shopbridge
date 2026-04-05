import { vi, describe, it, expect, beforeEach } from "vitest";
import { POST } from "@/app/api/webhooks/clerk/route";

vi.mock("@/lib/supabase/admin");

let mockHeaders: Map<string, string>;
vi.mock("next/headers", () => ({
  headers: async () => mockHeaders,
}));

let mockWebhookVerify: () => unknown;
vi.mock("svix", () => ({
  Webhook: class {
    constructor() {}
    verify() {
      return mockWebhookVerify();
    }
  },
}));

describe("POST /api/webhooks/clerk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaders = new Map([
      ["svix-id", "msg_123"],
      ["svix-timestamp", "1234567890"],
      ["svix-signature", "v1=signature"],
    ]);
    mockWebhookVerify = vi.fn();
  });

  it("returns 500 when CLERK_WEBHOOK_SECRET is missing", async () => {
    vi.stubEnv("CLERK_WEBHOOK_SECRET", "");
    const req = new Request("http://localhost:3000/api/webhooks/clerk", {
      method: "POST",
      body: "test",
    });

    const response = await POST(req);
    expect(response.status).toBe(500);
    expect(await response.text()).toContain("Missing CLERK_WEBHOOK_SECRET");
  });

  it("returns 400 on invalid webhook signature", async () => {
    vi.stubEnv("CLERK_WEBHOOK_SECRET", "test_secret");

    mockWebhookVerify.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const req = new Request("http://localhost:3000/api/webhooks/clerk", {
      method: "POST",
      body: "invalid",
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    expect(await response.text()).toContain("Invalid webhook signature");
  });
});
