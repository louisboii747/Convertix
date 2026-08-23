"use client";

import { useState } from "react";

type PasswordFieldProps = {
  id: string;
  name: string;
  autoComplete: string;
  placeholder?: string;
  minLength?: number;
  required?: boolean;
};

export function PasswordField({
  id,
  name,
  autoComplete,
  placeholder,
  minLength,
  required,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field-shell">
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        minLength={minLength}
        required={required}
      />
      <button
        className="password-visibility-toggle"
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        onClick={() => setVisible((value) => !value)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          {visible ? (
            <>
              <path d="M3 3l18 18" />
              <path d="M10.6 10.7a2 2 0 0 0 2.7 2.7" />
              <path d="M9.9 4.3A10.8 10.8 0 0 1 12 4c5.5 0 9 5 9 5a16 16 0 0 1-2.4 2.8M6.2 6.2C4.1 7.5 3 9 3 9s3.5 5 9 5c1 0 2-.2 2.8-.5" />
            </>
          ) : (
            <>
              <path d="M3 12s3.5-5 9-5 9 5 9 5-3.5 5-9 5-9-5-9-5Z" />
              <circle cx="12" cy="12" r="2.5" />
            </>
          )}
        </svg>
      </button>
    </div>
  );
}
