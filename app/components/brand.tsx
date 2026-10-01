import Link from "next/link";
export function Brand() {
  return <Link href="/" className="brand" aria-label="Foodfolio home"><span className="brand-mark" aria-hidden="true">f.</span>foodfolio<span className="brand-dot">.</span></Link>;
}
export function Footer() {
  return <footer className="site-footer"><span>Good food. Little moments. Happy memories.</span><span>Made with a love for food <span aria-hidden="true">♡</span></span></footer>;
}
export function Arrow() { return <span aria-hidden="true">↗</span>; }
