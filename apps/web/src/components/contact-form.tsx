"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type FormStatus = "idle" | "sending" | "success" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          subject: formData.get("subject"),
          message: formData.get("message"),
          company: formData.get("company"),
        }),
      });

      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Message could not be sent.");
      }

      form.reset();
      setStatus("success");
      setMessage("Message sent. Thanks — Convertix will get back to you soon.");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Message could not be sent. Please try again.",
      );
    }
  }

  return (
    <div className="contact-card">
      <div className="contact-card-heading">
        <span>Send a message</span>
        <span>Usually replied to personally</span>
      </div>

      <form className="contact-form" onSubmit={handleSubmit}>
        <div className="contact-field-row">
          <div className="auth-field">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Your name"
              maxLength={80}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              maxLength={160}
              required
            />
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="subject">Subject</label>
          <input
            id="subject"
            name="subject"
            type="text"
            placeholder="What can we help with?"
            maxLength={140}
            required
          />
        </div>

        <div className="auth-field contact-message-field">
          <label htmlFor="message">Message</label>
          <textarea
            id="message"
            name="message"
            placeholder="Tell us what’s on your mind."
            rows={7}
            maxLength={5000}
            required
          />
        </div>

        <div className="contact-honeypot" aria-hidden="true">
          <label htmlFor="company">Company</label>
          <input
            id="company"
            name="company"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {message ? (
          <div
            className={status === "success" ? "auth-success" : "auth-alert"}
            role="status"
            aria-live="polite"
          >
            {message}
          </div>
        ) : null}

        <button className="auth-submit" type="submit" disabled={status === "sending"}>
          <span>{status === "sending" ? "Sending…" : "Send message"}</span>
          <span aria-hidden="true">→</span>
        </button>

        <p className="contact-privacy-note">
          Your details are used only to respond to your message. See the{" "}
          <Link href="/privacy">privacy policy</Link> for more information.
        </p>
      </form>
    </div>
  );
}
