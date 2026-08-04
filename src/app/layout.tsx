import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Q-Link Checklist Mock",
  description: "Frontend-only production checklist prototype",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
