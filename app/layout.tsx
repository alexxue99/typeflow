import type { Metadata } from "next";
import { headers } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const image = "/icon.svg";
  return {
    metadataBase: new URL(`${protocol}://${host}`),
    title: "typeflow",
    description: "Calm, adaptive typing practice that stays on your device.",
    icons: { icon: [image] },
    openGraph: { title: "typeflow", description: "Find your rhythm. Build your flow.", images: [image] },
    twitter: { card: "summary_large_image", images: ["/twitter-image.png"] },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
