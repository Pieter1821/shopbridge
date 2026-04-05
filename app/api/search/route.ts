import { NextResponse } from "next/server";

import { searchStoreProducts } from "@/lib/shop";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const limitParam = Number(searchParams.get("limit") ?? "12");
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(Math.trunc(limitParam), 1), 24)
    : 12;

  const results = await searchStoreProducts(query, limit);

  return NextResponse.json({ results });
}
