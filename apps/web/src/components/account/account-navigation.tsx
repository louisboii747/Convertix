"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, History, Settings } from "lucide-react";
import styles from "./account.module.css";

const links = [
  { href: "/account", label: "Overview", icon: LayoutDashboard },
  { href: "/account/history", label: "History", icon: History },
  { href: "/account/settings", label: "Settings", icon: Settings },
];
export function AccountNavigation() {
  const pathname = usePathname();
  return (
    <nav className={styles.navigation} aria-label="Account navigation">
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={pathname === href ? "page" : undefined}
        >
          <Icon size={18} aria-hidden="true" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
