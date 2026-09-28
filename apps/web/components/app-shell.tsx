import Link from "next/link";

const activeItems = [
  { href: "/sites", label: "Sites" },
];
const plannedItems = ["Overview", "Guests", "Vouchers", "Plans", "Sessions", "Analytics", "Alerts", "Audit Logs", "Settings"];

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="app-grid">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark" aria-hidden="true" />QuotaMesh</div>
        <nav className="nav" aria-label="Primary navigation">
          {activeItems.map((item) => <Link className="active" key={item.href} href={item.href}>{item.label}</Link>)}
          {plannedItems.map((label) => <span className="disabled" aria-disabled="true" key={label}>{label}</span>)}
        </nav>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
