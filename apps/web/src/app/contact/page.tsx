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
            <p className="auth-eyebrow">Contact</p>
            <h1>Talk to Convertix.</h1>
            <p>
              Got a conversion request, found something that needs fixing, or
              just want to say hello? Send a message and it will land directly
              with Convertix.
            </p>

            <div className="contact-details" aria-label="Contact details">
              <div>
                <span>Email</span>
                <a href="mailto:louis@convertix.uk">louis@convertix.uk</a>
              </div>

              <div>
                <span>Best for</span>
                <strong>Support, feedback, ideas and partnerships</strong>
              </div>
            </div>
          </div>

          <ContactForm />
        </section>
      </main>
    </>
  );
}
