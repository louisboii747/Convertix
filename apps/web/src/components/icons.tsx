import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function IconBase({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 16V4" />
      <path d="m7.5 8.5 4.5-4.5 4.5 4.5" />
      <path d="M5 13.5v4.25A2.25 2.25 0 0 0 7.25 20h9.5A2.25 2.25 0 0 0 19 17.75V13.5" />
    </IconBase>
  );
}

export function FolderIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3.75 7.75h6l1.75 2h8.75v7.5A2.25 2.25 0 0 1 18 19.5H6A2.25 2.25 0 0 1 3.75 17.25Z" />
      <path d="M3.75 7.75V6.5A2 2 0 0 1 5.75 4.5h3.5l2.25 2.25h6.75a2 2 0 0 1 2 2v1" />
    </IconBase>
  );
}

export function FileIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6.5 2.75h7l4 4v14.5h-11Z" />
      <path d="M13.5 2.75v4h4" />
      <path d="M9 12h6M9 15.5h6" />
    </IconBase>
  );
}

export function ChevronIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m8 10 4 4 4-4" />
    </IconBase>
  );
}

export function ArrowIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 12h14" />
      <path d="m14 7 5 5-5 5" />
    </IconBase>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m6.5 12.5 3.25 3.25L17.5 8" />
    </IconBase>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m7 7 10 10M17 7 7 17" />
    </IconBase>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M19 8.5V4.75l-1.75 1.75A7.5 7.5 0 1 0 19.3 14" />
    </IconBase>
  );
}

export function DeviceIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="5" y="2.75" width="14" height="18.5" rx="2.25" />
      <path d="M9.5 17.75h5" />
    </IconBase>
  );
}

export function RouteIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="6" cy="6" r="2" />
      <circle cx="18" cy="18" r="2" />
      <path d="M8 6h5a3 3 0 0 1 3 3v0a3 3 0 0 1-3 3h-2a3 3 0 0 0-3 3v0a3 3 0 0 0 3 3h5" />
    </IconBase>
  );
}

export function AccountIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="m17.75 5.25 1.5 1.5 2.5-3" />
    </IconBase>
  );
}
