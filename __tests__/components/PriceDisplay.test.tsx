import { render, screen } from "@testing-library/react";
import { PriceDisplay } from "@/components/shared/PriceDisplay";

describe("PriceDisplay", () => {
  describe("primary price", () => {
    it("renders the formatted price", () => {
      render(<PriceDisplay priceCents={9999} />);
      const priceEl = screen.getByText(/99/);
      expect(priceEl).toBeInTheDocument();
    });

    it("applies font-semibold to the primary price", () => {
      render(<PriceDisplay priceCents={5000} />);
      const primaryPrice = screen.getByText(/R/i);
      expect(primaryPrice).toHaveClass("font-semibold");
    });

    it("renders without a compare-at price by default", () => {
      const { container } = render(<PriceDisplay priceCents={5000} />);
      const spans = container.querySelectorAll("span");
      expect(spans).toHaveLength(1);
    });

    it("renders 'R0' for 0 cents", () => {
      render(<PriceDisplay priceCents={0} />);
      expect(screen.getByText(/0/)).toBeInTheDocument();
    });
  });

  describe("compare-at price", () => {
    it("renders the compare-at price when compareAtPriceCents is truthy", () => {
      render(<PriceDisplay priceCents={5000} compareAtPriceCents={10000} />);
      const spans = screen.getAllByText(/R/i);
      expect(spans.length).toBeGreaterThanOrEqual(2);
    });

    it("applies a line-through style to the compare-at price", () => {
      render(<PriceDisplay priceCents={5000} compareAtPriceCents={10000} />);
      const allSpans = document.querySelectorAll("span");
      const compareAtSpan = Array.from(allSpans).find((span) =>
        span.classList.contains("line-through"),
      );
      expect(compareAtSpan).toBeTruthy();
    });

    it("does NOT render compare-at price when compareAtPriceCents is 0 (falsy)", () => {
      render(<PriceDisplay priceCents={5000} compareAtPriceCents={0} />);
      const spans = document.querySelectorAll("span");
      expect(spans).toHaveLength(1);
    });

    it("does NOT render compare-at price when compareAtPriceCents is undefined", () => {
      render(<PriceDisplay priceCents={5000} />);
      const spans = document.querySelectorAll("span");
      expect(spans).toHaveLength(1);
    });
  });

  describe("className forwarding", () => {
    it("applies a custom className to the wrapper div", () => {
      const { container } = render(
        <PriceDisplay priceCents={5000} className="my-custom-class" />,
      );
      expect(container.firstChild).toHaveClass("my-custom-class");
    });

    it("works without a className prop", () => {
      expect(() => render(<PriceDisplay priceCents={5000} />)).not.toThrow();
    });
  });
});
