import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Foodfolio | Gordon Ramsay-style food critiques",
  description: "Upload real food photos for original Gordon Ramsay-style AI critiques. Vote on funny commentary and discover food around NYC. AI imitation, not his actual review.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col"><a href="#main-content" className="skip-link">Skip to content</a>{children}</body>
    </html>
  );
}
