import type { Metadata } from "next";

import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "Learn how Convertix handles account information, uploaded files, analytics, and other data.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    type: "website",
    url: "/privacy",
    title: "Privacy — Convertix",
    description: "Learn how Convertix handles account information, uploaded files, analytics, and other data.",
    siteName: "Convertix",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy — Convertix",
    description: "Learn how Convertix handles account information, uploaded files, analytics, and other data.",
  },
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />

      <main className="legal-page" id="main-content">
        <header className="legal-hero">
          <p className="auth-eyebrow">Privacy</p>
          <h1>How Convertix handles your data.</h1>
          <p>
            This policy explains what information Convertix processes, why it is
            used, and the choices available to you.
          </p>
          <p className="legal-updated">Last updated: 19 August 2026</p>
        </header>

        <article className="legal-content">
          <section>
            <h2>Who operates Convertix</h2>

            <div>
              <p>
                Convertix operates the file conversion service available at
                convertix.uk.
              </p>

              <p>
                For privacy questions or requests, contact us at{" "}
                <a href="mailto:louis@convertix.uk">louis@convertix.uk</a>.
              </p>
            </div>
          </section>

          <section>
            <h2>Information we process</h2>

            <div>
              <p>
                Depending on how you use Convertix, we may process account
                information, technical information about your browser or device,
                analytics information, conversion-related information, and files
                that you choose to upload for conversion.
              </p>
            </div>
          </section>

          <section>
            <h2>Uploaded files and conversions</h2>

            <div>
              <p>
                Files are uploaded only when you choose to start a conversion.
                They are processed for the purpose of providing the requested
                conversion and may be temporarily stored within Convertix&apos;s
                cloud infrastructure while that work is carried out.
              </p>

              <p>
                Uploaded file contents are not intentionally used for
                advertising or product analytics.
              </p>
            </div>
          </section>

          <section>
            <h2>Accounts and authentication</h2>

            <div>
              <p>
                Convertix uses Supabase to provide authentication and account
                functionality. Account information can include your email
                address and display name. Convertix does not receive your
                password in readable form.
              </p>
            </div>
          </section>

          <section>
            <h2>Analytics</h2>

            <div>
              <p>
                Convertix uses PostHog to understand how the service is used and
                to improve reliability and usability. Analytics may include page
                visits, conversion workflow events, device and browser
                information, performance information, and interaction data.
              </p>
            </div>
          </section>

          <section>
            <h2>Session replay</h2>

            <div>
              <p>
                PostHog Session Replay may record interactions with the
                Convertix interface to help diagnose usability problems and
                product errors. Sensitive form inputs are configured to be
                masked.
              </p>

              <p>
                Session replay is not intended to record the contents of files
                you upload for conversion.
              </p>
            </div>
          </section>

          <section>
            <h2>Cookies and similar technologies</h2>

            <div>
              <p>
                Convertix may use cookies, browser storage, or similar
                technologies where they are needed for authentication,
                analytics, or related functionality.
              </p>
            </div>
          </section>

          <section>
            <h2>Service providers</h2>

            <div>
              <p>
                Convertix relies on third-party infrastructure and service
                providers, including Supabase for authentication, PostHog for
                product analytics and session replay, Amazon Web Services for
                conversion infrastructure, and Vercel for website hosting and
                delivery.
              </p>
            </div>
          </section>

          <section>
            <h2>Why we process information</h2>

            <div>
              <p>
                Information may be processed where it is necessary to provide
                the service you request, operate accounts and maintain the
                service, meet legal obligations, or where appropriate consent
                has been given for optional analytics technologies.
              </p>
            </div>
          </section>

          <section>
            <h2>Data retention</h2>

            <div>
              <p>
                Information is kept only for as long as reasonably necessary for
                the purposes for which it is processed. Retention can vary
                depending on the type of information and the infrastructure
                involved.
              </p>
            </div>
          </section>

          <section>
            <h2>International processing</h2>

            <div>
              <p>
                Some service providers may process information in countries
                other than your own. Where required, appropriate safeguards may
                apply to those transfers.
              </p>
            </div>
          </section>

          <section>
            <h2>Your rights</h2>

            <div>
              <p>
                Depending on applicable law, you may have rights relating to
                access, correction, deletion, restriction, objection, data
                portability, and withdrawal of consent where processing relies
                on consent.
              </p>

              <p>
                You may also have the right to raise a concern with the UK
                Information Commissioner&apos;s Office.
              </p>
            </div>
          </section>

          <section>
            <h2>Children&apos;s privacy</h2>

            <div>
              <p>
                Convertix is a general-purpose file conversion service and is
                not specifically designed to collect information from children.
              </p>
            </div>
          </section>

          <section>
            <h2>Changes to this policy</h2>

            <div>
              <p>
                This privacy policy may be updated as Convertix changes. The
                date shown at the top of this page indicates when it was last
                revised.
              </p>
            </div>
          </section>
        </article>
      </main>
    </>
  );
}
