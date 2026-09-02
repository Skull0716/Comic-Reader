// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import PWAInstaller from "@/app/components/PWAInstaller";

export const metadata: Metadata = {
  title: "Comic Reader",
  description: "Lector de cómics offline",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ComicReader",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Evita zoom de página para manejar zoom manual en el visor
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="bg-neutral-950 text-neutral-100 overflow-hidden select-none">
        <PWAInstaller />
        {children}
      </body>
    </html>
  );
}