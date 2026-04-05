import { useCartStore, type CartItem } from "@/store/cart-store";

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    productId: "prod-1",
    slug: "product-one",
    name: "Product One",
    brand: "Brand A",
    priceCents: 5000,
    quantity: 1,
    stockQuantity: 10,
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
  useCartStore.setState({ items: [], stockNotice: null });
});

describe("addItem — sold-out removal", () => {
  it("removes an existing item when stock is 0", () => {
    useCartStore.getState().addItem(makeItem({ quantity: 1, stockQuantity: 5 }));
    expect(useCartStore.getState().items).toHaveLength(1);
    useCartStore.getState().addItem(makeItem({ quantity: 1, stockQuantity: 0 }));
    expect(useCartStore.getState().items).toHaveLength(0);
    expect(useCartStore.getState().stockNotice).toContain("sold out");
  });

  it("does not add a new item when stock is 0", () => {
    useCartStore.getState().addItem(makeItem({ quantity: 1, stockQuantity: 0 }));
    expect(useCartStore.getState().items).toHaveLength(0);
    expect(useCartStore.getState().stockNotice).toContain("sold out");
  });
});

describe("addItem — existing item clamped", () => {
  it("clamps quantity to stock and sets a stockNotice", () => {
    useCartStore.getState().addItem(makeItem({ quantity: 3, stockQuantity: 5 }));
    useCartStore.getState().addItem(makeItem({ quantity: 4, stockQuantity: 5 }));
    const item = useCartStore.getState().items[0];
    expect(item.quantity).toBe(5);
    expect(useCartStore.getState().stockNotice).toContain("live stock");
  });

  it("updates quantity without clamping when sufficient stock exists", () => {
    useCartStore.getState().addItem(makeItem({ quantity: 1, stockQuantity: 10 }));
    useCartStore.getState().addItem(makeItem({ quantity: 2, stockQuantity: 10 }));
    expect(useCartStore.getState().items[0].quantity).toBe(3);
    expect(useCartStore.getState().stockNotice).toBeNull();
  });

  it("updates the stockQuantity metadata on the existing item", () => {
    useCartStore.getState().addItem(makeItem({ quantity: 1, stockQuantity: 10 }));
    useCartStore.getState().addItem(makeItem({ quantity: 1, stockQuantity: 8 }));
    expect(useCartStore.getState().items[0].stockQuantity).toBe(8);
  });
});

describe("addItem — new item", () => {
  it("adds a new item to an empty cart", () => {
    useCartStore.getState().addItem(makeItem({ quantity: 2 }));
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe("prod-1");
    expect(items[0].quantity).toBe(2);
  });

  it("adds distinct items to the cart", () => {
    useCartStore.getState().addItem(makeItem({ productId: "prod-1", quantity: 1 }));
    useCartStore.getState().addItem(makeItem({ productId: "prod-2", slug: "p2", quantity: 1 }));
    expect(useCartStore.getState().items).toHaveLength(2);
  });

  it("sets a stockNotice when the new item quantity is clamped", () => {
    useCartStore.getState().addItem(makeItem({ quantity: 5, stockQuantity: 3, name: "Limited Widget" }));
    const item = useCartStore.getState().items[0];
    expect(item.quantity).toBe(3);
    expect(useCartStore.getState().stockNotice).toContain("Limited Widget");
    expect(useCartStore.getState().stockNotice).toContain("3");
  });

  it("correctly handles singular 'unit' in notice for quantity = 1", () => {
    useCartStore.getState().addItem(makeItem({ quantity: 5, stockQuantity: 1, name: "Rare Item" }));
    expect(useCartStore.getState().stockNotice).toContain("1 unit");
    expect(useCartStore.getState().stockNotice).not.toContain("units");
  });

  it("uses plural 'units' in notice for quantity > 1", () => {
    useCartStore.getState().addItem(makeItem({ quantity: 10, stockQuantity: 2, name: "Popular Item" }));
    expect(useCartStore.getState().stockNotice).toContain("2 units");
  });
});

describe("removeItem", () => {
  it("removes the specified item", () => {
    useCartStore.getState().addItem(makeItem({ productId: "prod-1", quantity: 1 }));
    useCartStore.getState().addItem(makeItem({ productId: "prod-2", slug: "p2", quantity: 1 }));
    useCartStore.getState().removeItem("prod-1");
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].productId).toBe("prod-2");
  });

  it("clears the stockNotice when removing an item", () => {
    useCartStore.setState({ stockNotice: "Some notice" });
    useCartStore.getState().addItem(makeItem({ quantity: 1 }));
    useCartStore.getState().removeItem("prod-1");
    expect(useCartStore.getState().stockNotice).toBeNull();
  });
});

describe("updateQuantity", () => {
  it("returns state unchanged when productId is not in cart", () => {
    useCartStore.getState().addItem(makeItem({ quantity: 2 }));
    const stateBefore = useCartStore.getState().items;
    useCartStore.getState().updateQuantity("no-such-product", 5);
    expect(useCartStore.getState().items).toStrictEqual(stateBefore);
  });

  it("clamps quantity to stock when requested quantity exceeds stock", () => {
    useCartStore.getState().addItem(makeItem({ quantity: 1, stockQuantity: 3 }));
    useCartStore.getState().updateQuantity("prod-1", 10);
    expect(useCartStore.getState().items[0].quantity).toBe(3);
    expect(useCartStore.getState().stockNotice).toContain("live stock");
  });

  it("updates quantity to the specified value when within stock", () => {
    useCartStore.getState().addItem(makeItem({ quantity: 1, stockQuantity: 10 }));
    useCartStore.getState().updateQuantity("prod-1", 5);
    expect(useCartStore.getState().items[0].quantity).toBe(5);
    expect(useCartStore.getState().stockNotice).toBeNull();
  });
});

describe("syncStock", () => {
  it("is a no-op when the productId is not in the cart", () => {
    useCartStore.getState().addItem(makeItem({ quantity: 1 }));
    const stateBefore = useCartStore.getState().items;
    useCartStore.getState().syncStock("non-existent", 10);
    expect(useCartStore.getState().items).toStrictEqual(stateBefore);
  });

  it("returns the same state reference when nothing changes", () => {
    useCartStore.getState().addItem(makeItem({ quantity: 1, stockQuantity: 10 }));
    const stateBefore = useCartStore.getState();
    useCartStore.getState().syncStock("prod-1", 10);
    expect(useCartStore.getState().items[0].quantity).toBe(1);
    expect(useCartStore.getState().items[0].stockQuantity).toBe(10);
    expect(useCartStore.getState().stockNotice).toBeNull();
    expect(useCartStore.getState().items).toBe(stateBefore.items);
  });

  it("removes the item and sets a stockNotice when stock drops to 0", () => {
    useCartStore.getState().addItem(makeItem({ quantity: 2, stockQuantity: 5 }));
    useCartStore.getState().syncStock("prod-1", 0);
    expect(useCartStore.getState().items).toHaveLength(0);
    expect(useCartStore.getState().stockNotice).toContain("sold out");
  });

  it("clamps quantity and sets a real-time notice when stock drops below current quantity", () => {
    useCartStore.getState().addItem(makeItem({ quantity: 5, stockQuantity: 10 }));
    useCartStore.getState().syncStock("prod-1", 3);
    const item = useCartStore.getState().items[0];
    expect(item.quantity).toBe(3);
    expect(item.stockQuantity).toBe(3);
    expect(useCartStore.getState().stockNotice).toContain("real time");
  });

  it("updates stockQuantity without clamping when stock is still sufficient", () => {
    useCartStore.getState().addItem(makeItem({ quantity: 2, stockQuantity: 10 }));
    useCartStore.getState().syncStock("prod-1", 7);
    const item = useCartStore.getState().items[0];
    expect(item.quantity).toBe(2);
    expect(item.stockQuantity).toBe(7);
    expect(useCartStore.getState().stockNotice).toBeNull();
  });
});

describe("clearCart", () => {
  it("removes all items and clears the stockNotice", () => {
    useCartStore.getState().addItem(makeItem({ productId: "prod-1", quantity: 1 }));
    useCartStore.getState().addItem(makeItem({ productId: "prod-2", slug: "p2", quantity: 2 }));
    useCartStore.setState({ stockNotice: "Some notice" });
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toHaveLength(0);
    expect(useCartStore.getState().stockNotice).toBeNull();
  });
});

describe("clearStockNotice", () => {
  it("sets stockNotice to null", () => {
    useCartStore.setState({ stockNotice: "A notice" });
    useCartStore.getState().clearStockNotice();
    expect(useCartStore.getState().stockNotice).toBeNull();
  });
});

describe("totalCents", () => {
  it("returns 0 for an empty cart", () => {
    expect(useCartStore.getState().totalCents()).toBe(0);
  });

  it("sums priceCents * quantity for a single item", () => {
    useCartStore.getState().addItem(makeItem({ priceCents: 5000, quantity: 3 }));
    expect(useCartStore.getState().totalCents()).toBe(15000);
  });

  it("sums across multiple items", () => {
    useCartStore.getState().addItem(makeItem({ productId: "p1", priceCents: 1000, quantity: 2 }));
    useCartStore.getState().addItem(makeItem({ productId: "p2", slug: "p2", priceCents: 2000, quantity: 1 }));
    expect(useCartStore.getState().totalCents()).toBe(4000);
  });
});

describe("itemCount", () => {
  it("returns 0 for an empty cart", () => {
    expect(useCartStore.getState().itemCount()).toBe(0);
  });

  it("sums quantities across all items", () => {
    useCartStore.getState().addItem(makeItem({ productId: "p1", quantity: 3 }));
    useCartStore.getState().addItem(makeItem({ productId: "p2", slug: "p2", quantity: 2 }));
    expect(useCartStore.getState().itemCount()).toBe(5);
  });

  it("reflects quantity updates", () => {
    useCartStore.getState().addItem(makeItem({ quantity: 5, stockQuantity: 10 }));
    expect(useCartStore.getState().itemCount()).toBe(5);
    useCartStore.getState().updateQuantity("prod-1", 2);
    expect(useCartStore.getState().itemCount()).toBe(2);
  });
});
