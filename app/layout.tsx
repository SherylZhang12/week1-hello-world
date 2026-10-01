import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Foodfolio | My Favorite Foods",
  description: "A little collection of good taste. Explore favorite foods and make your profile yours.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col"><a href="#main-content" className="skip-link">Skip to content</a>{children}</body>
    </html>
  );
}
