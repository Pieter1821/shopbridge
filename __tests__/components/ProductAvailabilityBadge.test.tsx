import { render, screen } from "@testing-library/react";
import { ProductAvailabilityBadge } from "@/components/shared/ProductAvailabilityBadge";
import { useCartStore } from "@/store/cart-store";

beforeEach(() => {
  localStorage.clear();
  useCartStore.setState({ items: [], stockNotice: null });
});

describe("ProductAvailabilityBadge", () => {
  describe("when productId is not provided", () => {
    it("shows stock from the stock prop directly", () => {
      render(<ProductAvailabilityBadge stock={10} />);
      expect(screen.getByText("10 in stock")).toBeInTheDocument();
    });

    it("shows 'Out of stock' when stock is 0 and no productId", () => {
      render(<ProductAvailabilityBadge stock={0} />);
      expect(screen.getByText("Out of stock")).toBeInTheDocument();
    });
  });

  describe("when productId is provided but item is NOT in cart", () => {
    it("uses the stock prop as-is (no cart item to subtract)", () => {
      render(<ProductAvailabilityBadge productId="prod-999" stock={8} />);
      expect(screen.getByText("8 in stock")).toBeInTheDocument();
    });
  });

  describe("when the product IS in the cart", () => {
    beforeEach(() => {
      useCartStore.setState({
        items: [
          {
            productId: "prod-1",
            slug: "product-one",
            name: "Product One",
            brand: "Brand A",
            priceCents: 5000,
            quantity: 2,
            stockQuantity: 10,
          },
        ],
        stockNotice: null,
      });
    });

    it("subtracts the cart quantity from the live stock", () => {
      render(<ProductAvailabilityBadge productId="prod-1" stock={10} />);
      expect(screen.getByText("8 in stock")).toBeInTheDocument();
    });

    it("shows low stock after reservation reduces it below threshold", () => {
      useCartStore.setState({
        items: [
          {
            productId: "prod-1",
            slug: "product-one",
            name: "Product One",
            brand: "Brand A",
            priceCents: 5000,
            quantity: 7,
            stockQuantity: 10,
          },
        ],
        stockNotice: null,
      });
      render(<ProductAvailabilityBadge productId="prod-1" stock={10} />);
      expect(screen.getByText("Only 3 left")).toBeInTheDocument();
    });

    it("shows 'Out of stock' when cart quantity equals live stock", () => {
      useCartStore.setState({
        items: [
          {
            productId: "prod-1",
            slug: "product-one",
            name: "Product One",
            brand: "Brand A",
            priceCents: 5000,
            quantity: 2,
            stockQuantity: 2,
          },
        ],
        stockNotice: null,
      });
      render(<ProductAvailabilityBadge productId="prod-1" stock={2} />);
      expect(screen.getByText("Out of stock")).toBeInTheDocument();
    });

    it("prefers cartItem.stockQuantity over the stock prop", () => {
      render(<ProductAvailabilityBadge productId="prod-1" stock={10} />);
      expect(screen.getByText("8 in stock")).toBeInTheDocument();
    });

    it("falls back to stock prop when cartItem.stockQuantity is not a number", () => {
      useCartStore.setState({
        items: [
          {
            productId: "prod-1",
            slug: "product-one",
            name: "Product One",
            brand: "Brand A",
            priceCents: 5000,
            quantity: 1,
            stockQuantity: null,
          },
        ],
        stockNotice: null,
      });
      render(<ProductAvailabilityBadge productId="prod-1" stock={8} />);
      expect(screen.getByText("7 in stock")).toBeInTheDocument();
    });
  });

  describe("lowStockThreshold forwarding", () => {
    it("passes the lowStockThreshold to StockBadge", () => {
      render(
        <ProductAvailabilityBadge stock={10} lowStockThreshold={12} />,
      );
      expect(screen.getByText("Only 10 left")).toBeInTheDocument();
    });
  });
});
