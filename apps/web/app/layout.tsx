import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "QuotaMesh", template: "%s · QuotaMesh" },
  description: "Secure multi-tenant guest Wi-Fi quota enforcement and network operations.",
  applicationName: "QuotaMesh",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#07121d",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
