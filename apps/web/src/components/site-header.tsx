import { Brand } from "@/components/brand";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Brand />
        <nav className="site-nav" aria-label="Primary navigation">
          <Link href="/#how-it-works">How it works</Link>
          <Link href="/#formats">Formats</Link>
          <Link href="/#faq">FAQ</Link>
        </nav>
      </div>
    </header>
  );
}
