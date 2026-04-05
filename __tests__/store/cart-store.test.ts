import { beforeEach, describe, expect, it } from "vitest";
import { useCartStore, type CartItem } from "@/store/cart-store";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const base: CartItem = {
  productId: "p1",
  slug: "test-product",
  name: "Test Product",
  brand: "Test Brand",
  priceCents: 1000,
  quantity: 1,
};

function item(overrides: Partial<CartItem> = {}): CartItem {
  return { ...base, ...overrides };
}

function get() {
  return useCartStore.getState();
}

function seed(items: CartItem[], stockNotice: string | null = null) {
  useCartStore.setState({ items, stockNotice });
}

// ---------------------------------------------------------------------------
// Reset store to a clean slate before every test
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorage.clear();
  useCartStore.setState({ items: [], stockNotice: null });
});

// ---------------------------------------------------------------------------
// addItem
// ---------------------------------------------------------------------------

describe("addItem", () => {
  describe("new item (not already in cart)", () => {
    it("adds item with correct fields and null stockNotice", () => {
      get().addItem(item());
      expect(get().items).toHaveLength(1);
      expect(get().items[0]).toMatchObject({ productId: "p1", quantity: 1 });
      expect(get().stockNotice).toBeNull();
    });

    it("stores null stockQuantity when none is provided", () => {
      get().addItem(item());
      expect(get().items[0].stockQuantity).toBeNull();
    });

    it("stores the provided stockQuantity", () => {
      get().addItem(item({ stockQuantity: 10 }));
      expect(get().items[0].stockQuantity).toBe(10);
    });

    it("clamps quantity to stock and sets limited-stock notice (plural)", () => {
      get().addItem(item({ quantity: 5, stockQuantity: 3 }));
      expect(get().items[0].quantity).toBe(3);
      expect(get().stockNotice).toBe(
        "Only 3 units of Test Product are available right now."
      );
    });

    it("uses singular 'unit' when only 1 unit available", () => {
      get().addItem(item({ quantity: 5, stockQuantity: 1 }));
      expect(get().items[0].quantity).toBe(1);
      expect(get().stockNotice).toBe(
        "Only 1 unit of Test Product are available right now."
      );
    });

    it("sets no notice when requested quantity fits stock exactly", () => {
      get().addItem(item({ quantity: 3, stockQuantity: 3 }));
      expect(get().items[0].quantity).toBe(3);
      expect(get().stockNotice).toBeNull();
    });

    it("removes item and sets sold-out notice when stockQuantity is 0", () => {
      get().addItem(item({ stockQuantity: 0 }));
      expect(get().items).toHaveLength(0);
      expect(get().stockNotice).toBe(
        "Test Product is currently sold out and was removed from your cart."
      );
    });
  });

  describe("existing item (already in cart)", () => {
    it("increments quantity and clears notice", () => {
      get().addItem(item({ stockQuantity: 10 }));
      get().addItem(item({ quantity: 2, stockQuantity: 10 }));
      expect(get().items).toHaveLength(1);
      expect(get().items[0].quantity).toBe(3);
      expect(get().stockNotice).toBeNull();
    });

    it("clamps combined quantity to stock and sets live-stock notice", () => {
      get().addItem(item({ quantity: 2, stockQuantity: 3 }));
      get().addItem(item({ quantity: 2, stockQuantity: 3 }));
      expect(get().items[0].quantity).toBe(3);
      expect(get().stockNotice).toBe(
        "Cart updated to the live stock available for Test Product."
      );
    });

    it("updates stockQuantity on the existing cart item", () => {
      get().addItem(item({ stockQuantity: 10 }));
      get().addItem(item({ quantity: 1, stockQuantity: 5 }));
      expect(get().items[0].stockQuantity).toBe(5);
    });

    it("falls back to existing stockQuantity when new add omits it", () => {
      get().addItem(item({ stockQuantity: 8 }));
      get().addItem(item({ quantity: 1 })); // no stockQuantity
      expect(get().items[0].stockQuantity).toBe(8);
    });

    it("removes item and sets sold-out notice when combined quantity clamps to 0", () => {
      get().addItem(item({ quantity: 1 }));
      get().addItem(item({ quantity: 1, stockQuantity: 0 }));
      expect(get().items).toHaveLength(0);
      expect(get().stockNotice).toBe(
        "Test Product is currently sold out and was removed from your cart."
      );
    });
  });
});

// ---------------------------------------------------------------------------
// removeItem
// ---------------------------------------------------------------------------

describe("removeItem", () => {
  it("removes the correct item", () => {
    seed([
      item({ productId: "p1" }),
      item({ productId: "p2", slug: "p2" }),
    ]);
    get().removeItem("p1");
    expect(get().items).toHaveLength(1);
    expect(get().items[0].productId).toBe("p2");
  });

  it("clears stockNotice on removal", () => {
    seed([item()], "some notice");
    get().removeItem("p1");
    expect(get().stockNotice).toBeNull();
  });

  it("leaves cart unchanged when item does not exist", () => {
    seed([item()]);
    get().removeItem("nonexistent");
    expect(get().items).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// updateQuantity
// ---------------------------------------------------------------------------

describe("updateQuantity", () => {
  it("returns state unchanged when item is not in cart", () => {
    seed([item()]);
    get().updateQuantity("nonexistent", 3);
    expect(get().items).toHaveLength(1);
    expect(get().stockNotice).toBeNull();
  });

  it("updates quantity and sets no notice when within stock", () => {
    seed([item({ stockQuantity: 10 })]);
    get().updateQuantity("p1", 5);
    expect(get().items[0].quantity).toBe(5);
    expect(get().stockNotice).toBeNull();
  });

  it("clamps to stock limit and sets live-stock notice", () => {
    seed([item({ quantity: 2, stockQuantity: 5 })]);
    get().updateQuantity("p1", 10);
    expect(get().items[0].quantity).toBe(5);
    expect(get().stockNotice).toBe(
      "Quantity updated to match the live stock for Test Product."
    );
  });

  it("removes item and sets sold-out notice when stockQuantity is 0", () => {
    seed([item({ quantity: 2, stockQuantity: 0 })]);
    get().updateQuantity("p1", 3);
    expect(get().items).toHaveLength(0);
    expect(get().stockNotice).toBe(
      "Test Product is now sold out and was removed from your cart."
    );
  });

  it("clamps quantity to minimum 1 when no stock limit and 0 requested", () => {
    seed([item({ quantity: 2 })]); // no stockQuantity → null
    get().updateQuantity("p1", 0);
    expect(get().items[0].quantity).toBe(1);
    expect(get().stockNotice).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// syncStock
// ---------------------------------------------------------------------------

describe("syncStock", () => {
  it("returns state unchanged when item is not in cart", () => {
    seed([item()]);
    get().syncStock("nonexistent", 5);
    expect(get().items).toHaveLength(1);
    expect(get().stockNotice).toBeNull();
  });

  it("is a no-op when quantity and stockQuantity are already in sync", () => {
    seed([item({ quantity: 2, stockQuantity: 5 })]);
    const before = get().items;
    get().syncStock("p1", 5); // nothing changes
    expect(get().items).toBe(before); // same reference — Zustand skipped the update
    expect(get().stockNotice).toBeNull();
  });

  it("removes item and sets sold-out notice when stock drops to 0", () => {
    seed([item({ quantity: 2, stockQuantity: 5 })]);
    get().syncStock("p1", 0);
    expect(get().items).toHaveLength(0);
    expect(get().stockNotice).toBe(
      "Test Product sold out and was removed from your cart."
    );
  });

  it("reduces quantity and sets real-time notice when stock drops below current quantity", () => {
    seed([item({ quantity: 5, stockQuantity: 10 })]);
    get().syncStock("p1", 3);
    expect(get().items[0].quantity).toBe(3);
    expect(get().items[0].stockQuantity).toBe(3);
    expect(get().stockNotice).toBe(
      "Cart updated in real time for Test Product — only 3 left."
    );
  });

  it("updates stockQuantity without changing quantity or notice when stock increases", () => {
    seed([item({ quantity: 2, stockQuantity: 3 })]);
    get().syncStock("p1", 10);
    expect(get().items[0].quantity).toBe(2);
    expect(get().items[0].stockQuantity).toBe(10);
    expect(get().stockNotice).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// clearCart
// ---------------------------------------------------------------------------

describe("clearCart", () => {
  it("empties items and clears stockNotice", () => {
    seed([item(), item({ productId: "p2", slug: "p2" })], "some notice");
    get().clearCart();
    expect(get().items).toHaveLength(0);
    expect(get().stockNotice).toBeNull();
  });

  it("is safe to call on an already empty cart", () => {
    get().clearCart();
    expect(get().items).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// clearStockNotice
// ---------------------------------------------------------------------------

describe("clearStockNotice", () => {
  it("clears the notice without touching items", () => {
    seed([item()], "notice to clear");
    get().clearStockNotice();
    expect(get().stockNotice).toBeNull();
    expect(get().items).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// totalCents
// ---------------------------------------------------------------------------

describe("totalCents", () => {
  it("returns 0 for an empty cart", () => {
    expect(get().totalCents()).toBe(0);
  });

  it("calculates correctly for a single item with quantity > 1", () => {
    seed([item({ priceCents: 999, quantity: 3 })]);
    expect(get().totalCents()).toBe(2997);
  });

  it("sums across multiple items", () => {
    seed([
      item({ productId: "p1", priceCents: 1000, quantity: 2 }),
      item({ productId: "p2", slug: "p2", priceCents: 500, quantity: 3 }),
    ]);
    expect(get().totalCents()).toBe(3500);
  });
});

// ---------------------------------------------------------------------------
// itemCount
// ---------------------------------------------------------------------------

describe("itemCount", () => {
  it("returns 0 for an empty cart", () => {
    expect(get().itemCount()).toBe(0);
  });

  it("sums quantities across all cart items", () => {
    seed([
      item({ productId: "p1", quantity: 2 }),
      item({ productId: "p2", slug: "p2", quantity: 3 }),
    ]);
    expect(get().itemCount()).toBe(5);
  });
});
