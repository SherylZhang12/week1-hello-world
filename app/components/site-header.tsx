"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions";
import { Brand } from "./brand";

const destinations = [
  { href: "/", label: "Home" },
  { href: "/captions", label: "Explore posts" },
  { href: "/eat", label: "Find a restaurant" },
  { href: "/meal-coach", label: "Plan my meals" },
];
const routeHelp: Record<string, { name: string; purpose: string; steps: string[] }> = {
  "/captions": { name: "Explore & share", purpose: "Browse freely, or sign in to share your own meal.", steps: ["Explore posts", "Create a post", "Preview", "Publish"] },
  "/eat": { name: "Find a restaurant", purpose: "Turn your location and group preferences into nearby ideas.", steps: ["Add preferences", "Compare places", "Choose a restaurant", "Share later"] },
  "/favorites": { name: "My food ratings", purpose: "Build your own general list of foods and 1–10 ratings.", steps: ["Name a food", "Choose a rating", "Save it", "Find it nearby"] },
  "/meal-coach": { name: "Plan my meals", purpose: "Use today’s meals and your goals to plan what comes next.", steps: ["Add context", "Upload meals", "Get ideas", "Choose next meal"] },
  "/profile": { name: "My profile", purpose: "Update the name and photo people see with your posts.", steps: ["Add your name", "Upload a photo", "Save", "Return to posts"] },
  "/private": { name: "Members-only space", purpose: "This page confirms that the protected sign-in flow works.", steps: ["Signed in", "Protected access", "Edit profile", "Explore Foodfolio"] },
  "/login": { name: "Sign in", purpose: "Sign in with Google to create, save, vote, search and plan.", steps: ["Continue with Google", "Complete profile", "Choose a feature", "Start"] },
};
export default function SiteHeader({ loggedIn = false }: { loggedIn?: boolean }) {
  const pathname = usePathname();
  const help = routeHelp[pathname];
  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);
  return <><header className="site-header unified-header"><Brand /><nav aria-label="Main navigation">{destinations.map(item => <Link key={item.href} className="nav-link" href={item.href} aria-current={isActive(item.href) ? "page" : undefined}>{item.label}</Link>)}<Link href="/#getting-started" className="nav-link nav-help">New here?</Link></nav><div className="header-account">{loggedIn ? <><Link href="/profile" className="nav-link" aria-current={pathname === "/profile" ? "page" : undefined}>My profile</Link><form action={signOut}><button className="button button-small button-outline">Sign out</button></form></> : <Link href="/login" className="button button-small" aria-current={pathname === "/login" ? "page" : undefined}>Sign in ↗</Link>}</div></header>{help && <aside className="page-wayfinder" aria-label="Current page guide"><div className="wayfinder-location"><span>You’re here</span><strong>{help.name}</strong><p>{help.purpose}</p></div><ol aria-label={`${help.name} steps`}>{help.steps.map((step, index) => <li key={step}><span>{index + 1}</span>{step}</li>)}</ol><Link href="/#getting-started">View all options →</Link></aside>}</>;
}
