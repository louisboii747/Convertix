import { Brand } from "@/components/brand";
import { HeaderNavigation } from "@/components/header-navigation";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Brand />
        <HeaderNavigation />
      </div>
    </header>
  );
}
