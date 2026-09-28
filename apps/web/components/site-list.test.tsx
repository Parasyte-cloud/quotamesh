import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteList } from "./site-list";

describe("SiteList", () => {
  it("renders hostile tenant strings as inert text rather than executable markup", () => {
    const hostile = '<img src=x onerror="globalThis.pwned=true">';
    const html = renderToStaticMarkup(
      <SiteList sites={[{ siteId: "site-1", name: hostile, vendor: "unifi", timezone: "Africa/Lagos" }]} />,
    );

    expect(html).toContain("&lt;img src=x onerror=&quot;globalThis.pwned=true&quot;&gt;");
    expect(html).not.toContain("<img src=x");
  });

  it("renders an accessible error state", () => {
    const html = renderToStaticMarkup(<SiteList sites={[]} error="Service unavailable" />);
    expect(html).toContain('role="alert"');
    expect(html).toContain("Service unavailable");
  });
});
