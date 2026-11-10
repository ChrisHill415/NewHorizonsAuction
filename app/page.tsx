import AuctionItemForm from "./auction-item-form";

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10 font-sans text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <AuctionItemForm />
      </div>
    </main>
  );
}
