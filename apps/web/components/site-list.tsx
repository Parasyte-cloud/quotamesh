export interface SiteListItem {
  siteId: string;
  name: string;
  vendor: string;
  timezone: string;
}

export function SiteList({ sites, error }: Readonly<{ sites: SiteListItem[]; error?: string }>) {
  if (error) {
    return <div className="card empty error" role="alert">{error}</div>;
  }
  if (sites.length === 0) {
    return <div className="card empty">No sites have been onboarded yet.</div>;
  }

  return (
    <section className="card" aria-label="Network sites">
      {sites.map((site) => (
        <article className="site-row" key={site.siteId}>
          <div><div className="site-name">{site.name}</div><div className="site-meta">{site.siteId}</div></div>
          <div className="site-meta">{site.vendor}</div>
          <div className="site-meta">{site.timezone}</div>
          <div className="site-meta"><span className="status-dot" aria-hidden="true" />Configured</div>
        </article>
      ))}
    </section>
  );
}
