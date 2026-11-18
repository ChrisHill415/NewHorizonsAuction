import { Suspense } from "react";
import { connection } from "next/server";

type Item = {
  id: string;
  title: string;
  description: string;
  retail_value: number;
  minimum_bid: number;
  bid_increment: number;
  image_urls: string[] | null;
  donor_url: string | null;
  status: string;
  created_at: string;
};

async function getItems(): Promise<Item[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase environment variables.");
  }

  const res = await fetch(
    `${url}/rest/v1/items?select=*&status=eq.published&order=created_at.desc`,
    {
      headers: { apikey: key },
      cache: "no-store",
    }
  );
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Supabase request failed (${res.status}): ${detail}`);
  }
  return res.json();
}

const money = (n: number) =>
  Number(n).toLocaleString("en-US", { style: "currency", currency: "USD" });

function ItemCard({ item }: { item: Item }) {
  const photo = Array.isArray(item.image_urls) ? item.image_urls[0] : undefined;

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="aspect-[4/3] w-full bg-slate-200">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-full w-full items-center justify-center text-6xl font-semibold text-[#14213d]/25"
          >
            {item.title.charAt(0)}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold leading-snug text-[#14213d]">
            {item.title}
          </h2>
          <p className="line-clamp-2 text-sm text-slate-600">
            {item.description}
          </p>
        </div>

        <div className="mt-auto space-y-3 border-t border-slate-100 pt-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-slate-500">Minimum bid</p>
              <p className="text-xl font-semibold text-[#0f766e]">
                {money(item.minimum_bid)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Retail value</p>
              <p className="text-sm font-medium text-slate-600">
                {money(item.retail_value)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <p className="text-slate-600">
              Bid increment {money(item.bid_increment)}
            </p>
            {item.donor_url && (
              <a
                href={item.donor_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#0f766e] underline underline-offset-2"
              >
                About the donor
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

async function ItemGrid() {
  await connection(); // fetch fresh data on every request
  const items = await getItems();

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-slate-600">
        No items yet. Published items will show up here.
      </p>
    );
  }

  return (
    <>
      <p className="-mt-6 mb-8 text-slate-600">
        {items.length} {items.length === 1 ? "item" : "items"} open for bidding
      </p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </>
  );
}

function GridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-80 animate-pulse rounded-lg border border-slate-200 bg-white"
        />
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#eef2f6]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="mb-8 text-3xl font-semibold text-[#14213d]">
          New Horizons Auction
        </h1>
        <Suspense fallback={<GridSkeleton />}>
          <ItemGrid />
        </Suspense>
      </div>
    </main>
  );
}