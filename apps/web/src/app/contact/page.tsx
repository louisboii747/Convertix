import type { Metadata } from "next";

import { SiteHeader } from "@/components/site-header";
import { ContactForm } from "@/components/contact-form";
import "./contact.css";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Convertix for support, feedback, conversion requests, partnerships, or general questions.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    type: "website",
    url: "/contact",
    title: "Contact Convertix",
    description: "Contact Convertix for support, feedback, conversion requests, partnerships, or general questions.",
    siteName: "Convertix",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Convertix",
    description: "Contact Convertix for support, feedback, conversion requests, partnerships, or general questions.",
  },
};

export default function ContactPage() {
  return (
    <>
      <SiteHeader />

      <main className="contact-page" id="main-content">
        <section className="contact-shell">
          <div className="contact-intro">
            <h1>Contact Convertix</h1>
            <p>
              Ask for help, report a problem, or suggest a conversion. Your
              message goes to the person building Convertix.
            </p>

            <div className="contact-details" aria-label="Contact details">
              <div>
                <span>Email</span>
                <a href="mailto:louis@convertix.uk">louis@convertix.uk</a>
              </div>

              <div>
                <span>Best for</span>
                <strong>Support, feedback, requests and partnerships</strong>
              </div>
            </div>
          </div>

          <ContactForm />
        </section>
      </main>
    </>
  );
}
