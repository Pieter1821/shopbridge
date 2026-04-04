import type { StorefrontProduct } from "@/lib/shop";

import { ProductCard } from "./ProductCard";

export function ProductGrid({ products }: { products: StorefrontProduct[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
