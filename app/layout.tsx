import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "../styles/public.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });

export const metadata: Metadata = {
  title: "IPAM Alumni Unified",
  description: "IPAM Alumni Association platform — public portal and admin back office.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <head>
        {/*
         * Loaded once here (persistent root layout, never unmounts on
         * client-side navigation) rather than in the nested admin dashboard
         * layout — a <link> rendered inside a layout segment that itself
         * mounts/unmounts during client transitions (e.g. right after
         * /admin/login redirects to /admin) was unreliable: the icon font
         * sometimes never fired its request, so Material Symbols ligature
         * text ("dashboard", "search", ...) rendered as literal words
         * instead of icon glyphs. Living in the root <head> guarantees it's
         * present in the very first response and never re-mounted.
         */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
