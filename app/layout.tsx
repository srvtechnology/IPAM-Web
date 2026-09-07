import type { Metadata } from "next";
import "../styles/public.css";

export const metadata: Metadata = {
  title: "IPAM Alumni Unified",
  description: "IPAM Alumni Association platform — public portal and admin back office.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
