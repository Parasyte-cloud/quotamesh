import Link from "next/link";

export default function HomePage() {
  return (
    <main className="landing">
      <section className="hero">
        <div className="eyebrow">Secure network access control</div>
        <h1>QuotaMesh</h1>
        <p>
          Multi-tenant guest Wi-Fi quota enforcement, site health and voucher operations for UniFi,
          Meraki and MikroTik networks. Built around tenant isolation and private network control.
        </p>
        <p><Link href="/sites">Open control plane →</Link></p>
      </section>
    </main>
  );
}
