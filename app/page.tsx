type Item = {
  id: string;
  title: string;
  description: string;
  retail_value: number;
  minimum_bid: number;
  bid_increment: number;
  image_urls: string[];
  donor_url: string | null;
  status: string;
  created_at: string;
};

// Sample rows. Image URLs are placeholder photos from picsum.photos and
// donor URLs are placeholders. Swap in real ones when you have them.
const items: Item[] = [
  {
    id: "14e0855d-8861-4851-a99e-9722bebab377",
    title: "Stallion Breeding Package",
    description: "Sample stallion breeding package.",
    retail_value: 5000,
    minimum_bid: 1000,
    bid_increment: 100,
    image_urls: [
      "https://t4.ftcdn.net/jpg/00/22/60/09/360_F_22600957_lcQTgo5jOHqgxXfDtmHv5LtyR1MbdlvE.jpg",
    ],
    donor_url: "https://www.google.com/?zx=1794289768880",
    status: "published",
    created_at: "2026-11-06 04:12:49.625266+00",
  },
  {
    id: "57ae371f-769e-4a56-bcf3-d88c21b7a435",
    title: "Horse Grooming Kit",
    description: "Complete grooming kit with brushes and accessories.",
    retail_value: 150,
    minimum_bid: 40,
    bid_increment: 10,
    image_urls: ["https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgtoGwVFZ_7cG_Ni8alLqk6n6wpOk6U1rRkJyZDMenCA&s=10"],
    donor_url: "https://www.google.com/?zx=1794289768880",
    status: "published",
    created_at: "2026-11-06 04:12:49.625266+00",
  },
  {
    id: "d98ae80a-9ce7-4e03-9fc2-9b3cfdb746c6",
    title: "Western Leather Saddle",
    description: "Handcrafted western saddle with premium leather.",
    retail_value: 1200,
    minimum_bid: 300,
    bid_increment: 25,
    image_urls: ["https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQs5oVbCboYmX5ZDELOW7JrPNUbyA8bfGOGVsr959_nqA&s=10"],
    donor_url: "https://www.google.com/?zx=1794289768880",
    status: "published",
    created_at: "2026-11-06 04:12:49.625266+00",
  },
];

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

function ItemCard({ item }: { item: Item }) {
  const photo = item.image_urls[0];

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

export default function Home() {
  const published = items.filter((item) => item.status === "published");

  return (
    <main className="min-h-screen bg-[#eef2f6]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-semibold text-[#14213d]">
          New Horizons Auction
        </h1>
        <p className="mb-8 mt-1 text-slate-600">
          {published.length} {published.length === 1 ? "item" : "items"} open
          for bidding
        </p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {published.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </main>
  );
}