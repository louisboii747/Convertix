import type { Metadata } from "next";

import { BackToTopButton } from "@/components/back-to-top-button";
import { ConversionLandingPage } from "@/components/conversion-landing-page";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      <ConversionLandingPage />
      <BackToTopButton />
    </>
  );
}
