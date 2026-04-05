import { render, screen } from "@testing-library/react";
import { StockBadge } from "@/components/shared/StockBadge";

describe("StockBadge", () => {
  describe("when stock is 0", () => {
    it("renders 'Out of stock' text", () => {
      render(<StockBadge stock={0} />);
      expect(screen.getByText("Out of stock")).toBeInTheDocument();
    });

    it("applies the red color classes", () => {
      render(<StockBadge stock={0} />);
      const badge = screen.getByText("Out of stock");
      expect(badge).toHaveClass("text-red-700");
      expect(badge).toHaveClass("bg-red-50");
    });
  });

  describe("when stock is low (within default threshold of 5)", () => {
    it("renders 'Only N left' for stock = 1", () => {
      render(<StockBadge stock={1} />);
      expect(screen.getByText("Only 1 left")).toBeInTheDocument();
    });

    it("renders 'Only N left' for stock = 5 (boundary, inclusive)", () => {
      render(<StockBadge stock={5} />);
      expect(screen.getByText("Only 5 left")).toBeInTheDocument();
    });

    it("applies the amber color classes", () => {
      render(<StockBadge stock={3} />);
      const badge = screen.getByText("Only 3 left");
      expect(badge).toHaveClass("text-amber-700");
      expect(badge).toHaveClass("bg-amber-50");
    });
  });

  describe("when stock is above threshold", () => {
    it("renders 'N in stock' for stock = 6 (just above default threshold)", () => {
      render(<StockBadge stock={6} />);
      expect(screen.getByText("6 in stock")).toBeInTheDocument();
    });

    it("renders 'N in stock' for large stock values", () => {
      render(<StockBadge stock={999} />);
      expect(screen.getByText("999 in stock")).toBeInTheDocument();
    });

    it("applies the emerald color classes", () => {
      render(<StockBadge stock={50} />);
      const badge = screen.getByText("50 in stock");
      expect(badge).toHaveClass("text-emerald-700");
      expect(badge).toHaveClass("bg-emerald-50");
    });
  });

  describe("with a custom lowStockThreshold", () => {
    it("uses the custom threshold instead of the default 5", () => {
      render(<StockBadge stock={10} lowStockThreshold={15} />);
      expect(screen.getByText("Only 10 left")).toBeInTheDocument();
    });

    it("uses default threshold of 5 when lowStockThreshold is null", () => {
      render(<StockBadge stock={5} lowStockThreshold={null} />);
      expect(screen.getByText("Only 5 left")).toBeInTheDocument();
    });

    it("uses default threshold of 5 when lowStockThreshold is 0", () => {
      render(<StockBadge stock={3} lowStockThreshold={0} />);
      expect(screen.getByText("Only 3 left")).toBeInTheDocument();
    });

    it("boundary: stock equals custom threshold → low stock", () => {
      render(<StockBadge stock={20} lowStockThreshold={20} />);
      expect(screen.getByText("Only 20 left")).toBeInTheDocument();
    });

    it("boundary: stock = custom threshold + 1 → in stock", () => {
      render(<StockBadge stock={21} lowStockThreshold={20} />);
      expect(screen.getByText("21 in stock")).toBeInTheDocument();
    });
  });

  describe("rendered element", () => {
    it("renders a <span> element", () => {
      const { container } = render(<StockBadge stock={5} />);
      expect(container.firstChild?.nodeName).toBe("SPAN");
    });

    it("always includes the base badge classes", () => {
      render(<StockBadge stock={10} />);
      const badge = screen.getByText("10 in stock");
      expect(badge).toHaveClass("inline-flex");
      expect(badge).toHaveClass("rounded-full");
      expect(badge).toHaveClass("text-xs");
    });
  });
});
