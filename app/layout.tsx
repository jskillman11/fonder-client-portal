import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fonder Studio — Client Onboarding",
  description: "Review and sign your engagement with Fonder Studio.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
