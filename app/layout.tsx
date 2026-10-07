import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Foodfolio | Good Food. Tiny Company.",
  description: "Add spoon-sized kittens, puppies and bunnies to your real food photos. Share AI creations, vote on favorites and discover meals around NYC.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col"><a href="#main-content" className="skip-link">Skip to content</a>{children}</body>
    </html>
  );
}
