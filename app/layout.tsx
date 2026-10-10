import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Foodfolio | Find your next bite. Share your honest take.",
  description: "Find restaurants for your cravings, share real meal photos and honest reviews, and add playful AI chef, cat or dog reactions.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col"><a href="#main-content" className="skip-link">Skip to content</a>{children}</body>
    </html>
  );
}
