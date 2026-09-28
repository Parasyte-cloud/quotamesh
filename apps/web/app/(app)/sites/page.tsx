import { SiteList, type SiteListItem } from "@/components/site-list";
import { apiFetch } from "@/lib/api";

export const metadata = { title: "Sites" };

export default async function SitesPage() {
  let sites: SiteListItem[] = [];
  let error: string | undefined;

  try {
    const response = await apiFetch<{ data: SiteListItem[] }>("/v1/sites");
    sites = response.data;
  } catch {
    error = "Sites could not be loaded. Check your session or service health and try again.";
  }

  return (
    <>
      <header className="topbar">
        <div className="title"><h2>Sites</h2><p>Tenant-scoped network inventory and onboarding status.</p></div>
        <span className="badge">Security-first control plane</span>
      </header>
      <SiteList
        sites={sites}
        {...(error !== undefined ? { error } : {})}
      />
    </>
  );
}
