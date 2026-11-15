export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <main>
      <div className="page-heading">
        <p>My account</p>
        <span>A COMMUNITY OF GENEROSITY. A CAUSE THAT MATTERS.</span>
      </div>
      <div className="account-main">
        <aside className="auction-intro" aria-label="Our auction community">
          <div className="auction-photo" aria-hidden="true" />
          <div className="intro-content">
            <span className="eyebrow">THE NEW HORIZONS AUCTION</span>
            <h2>A tradition of giving.<br />A brighter tomorrow.</h2>
            <p>Join a community that turns a love of horses into hope for children.</p>
            <div className="intro-rule" />
            <span className="intro-note">A little generosity goes a long way.</span>
          </div>
        </aside>
        {children}
      </div>
    </main>
  );
}
