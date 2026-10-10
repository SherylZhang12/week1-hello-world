"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions";
import { Brand } from "./brand";

const destinations = [
  { href: "/", label: "Home" },
  { href: "/captions", label: "Community" },
  { href: "/eat", label: "Find food" },
  { href: "/meal-coach", label: "Meal coach" },
];
export default function SiteHeader({ loggedIn = false }: { loggedIn?: boolean }) {
  const pathname = usePathname();
  return <header className="site-header unified-header"><Brand /><nav aria-label="Main navigation">{destinations.map(item => <Link key={item.href} className="nav-link" href={item.href} aria-current={pathname === item.href ? "page" : undefined}>{item.label}</Link>)}<Link href="/#getting-started" className="nav-link">Quick guide</Link></nav><div className="header-account">{loggedIn ? <><Link href="/profile" className="nav-link" aria-current={pathname === "/profile" ? "page" : undefined}>My profile</Link><form action={signOut}><button className="button button-small button-outline">Sign out</button></form></> : <Link href="/login" className="button button-small" aria-current={pathname === "/login" ? "page" : undefined}>Sign in ↗</Link>}</div></header>;
}
