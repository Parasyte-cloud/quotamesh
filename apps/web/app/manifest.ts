import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "QuotaMesh",
    short_name: "QuotaMesh",
    description: "Secure multi-tenant guest Wi-Fi quota enforcement and network operations.",
    start_url: "/sites",
    display: "standalone",
    background_color: "#07121d",
    theme_color: "#07121d",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
