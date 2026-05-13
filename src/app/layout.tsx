import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastRoot } from "@/components/ui/use-toast";
import { ReactQueryProvider } from "@/components/providers/react-query-provider";

export const metadata: Metadata = {
  title: "ホテル在庫管",
  description: "ホテル現場の月次棚卸し業務をデジタル化する在庫管理ツール",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "在庫管理",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <ReactQueryProvider>
          <ToastRoot>{children}</ToastRoot>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
