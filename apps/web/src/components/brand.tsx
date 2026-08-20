import Link from "next/link";

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="Convertix home">
      <svg className="brand-mark" viewBox="0 0 36 36" aria-hidden="true" focusable="false">
        <path
          d="M8 9.5 17.5 18 8 26.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="m28 9.5-9.5 8.5 9.5 8.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.45"
        />
      </svg>
      <span>Convertix</span>
    </Link>
  );
}
