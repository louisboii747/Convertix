"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type {
  ButtonHTMLAttributes,
  ComponentPropsWithoutRef,
  CSSProperties,
  ReactNode,
} from "react";

type FlowButtonVariant = "outline" | "primary" | "dark" | "success";
type FlowButtonShape = "pill" | "rounded";
type FlowButtonSize = "sm" | "md" | "lg";

type FlowButtonCommonProps = {
  text?: ReactNode;
  variant?: FlowButtonVariant;
  shape?: FlowButtonShape;
  size?: FlowButtonSize;
  className?: string;
  style?: CSSProperties;
};

type FlowButtonElementProps = FlowButtonCommonProps &
  Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "children" | "className" | "style"
  > & {
    href?: never;
  };

type FlowButtonLinkProps = FlowButtonCommonProps &
  Omit<
    ComponentPropsWithoutRef<typeof Link>,
    "children" | "className" | "style"
  > & {
    href: ComponentPropsWithoutRef<typeof Link>["href"];
  };

export type FlowButtonProps = FlowButtonElementProps | FlowButtonLinkProps;

const variantStyles: Record<
  FlowButtonVariant,
  {
    border: string;
    background: string;
    foreground: string;
    fill: string;
    shadow: string;
  }
> = {
  outline: {
    border: "var(--cobalt)",
    background: "transparent",
    foreground: "var(--cobalt-dark)",
    fill: "var(--cobalt-soft)",
    shadow: "none",
  },
  primary: {
    border: "var(--cobalt)",
    background: "var(--cobalt)",
    foreground: "var(--surface)",
    fill: "var(--ink-950)",
    shadow: "var(--shadow-button)",
  },
  dark: {
    border: "var(--ink-950)",
    background: "var(--ink-950)",
    foreground: "var(--surface)",
    fill: "var(--cobalt)",
    shadow: "var(--shadow-button)",
  },
  success: {
    border: "var(--mint-ink)",
    background: "var(--mint-ink)",
    foreground: "var(--surface)",
    fill: "var(--ink-950)",
    shadow: "var(--shadow-button)",
  },
};

const shapeClasses: Record<FlowButtonShape, string> = {
  pill: "rounded-full hover:rounded-xl disabled:hover:rounded-full",
  rounded: "rounded-xl hover:rounded-lg disabled:hover:rounded-xl",
};

const sizeClasses: Record<FlowButtonSize, string> = {
  sm: "min-h-11 px-5 py-2 text-sm",
  md: "min-h-12 px-6 py-3 text-sm sm:px-8",
  lg: "min-h-[58px] px-7 py-3.5 text-base sm:px-9",
};

function FlowButtonContent({ text }: Pick<FlowButtonCommonProps, "text">) {
  return (
    <>
      <span
        aria-hidden="true"
        className="absolute left-[-25%] z-[2] transition-[left] duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:left-4 group-disabled:left-[-25%] motion-reduce:transition-none"
        style={{ color: "var(--flow-label, var(--flow-foreground))" }}
      >
        <ArrowRight className="size-4" />
      </span>

      <span
        className="relative z-[1] -translate-x-3 whitespace-nowrap transition-transform duration-[800ms] ease-out group-hover:translate-x-3 group-disabled:-translate-x-3 motion-reduce:transition-none"
        style={{ color: "var(--flow-label, var(--flow-foreground))" }}
      >
        {text}
      </span>

      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 scale-100 rounded-full bg-[var(--flow-fill)] opacity-0 transition-[transform,opacity] duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-[100] group-hover:opacity-100 group-disabled:scale-100 group-disabled:opacity-0 motion-reduce:transition-none"
      />

      <span
        aria-hidden="true"
        className="absolute right-4 z-[2] transition-[right] duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:right-[-25%] group-disabled:right-4 motion-reduce:transition-none"
        style={{ color: "var(--flow-label, var(--flow-foreground))" }}
      >
        <ArrowRight className="size-4" />
      </span>
    </>
  );
}

export function FlowButton({
  text = "Modern Button",
  className,
  variant = "outline",
  shape = "pill",
  size = "md",
  style,
  ...props
}: FlowButtonProps) {
  const colors = variantStyles[variant];
  const flowStyle = {
    "--flow-border": colors.border,
    "--flow-background": colors.background,
    "--flow-foreground": colors.foreground,
    "--flow-fill": colors.fill,
    "--flow-shadow": colors.shadow,
    ...style,
  } as CSSProperties;
  const flowClassName = [
    "group relative isolate inline-flex max-w-full min-w-0 cursor-pointer items-center justify-center gap-1 overflow-hidden border-[1.5px] border-[color:var(--flow-border)] bg-[var(--flow-background)] font-semibold text-[var(--flow-foreground)] no-underline shadow-[var(--flow-shadow)] transition-[border-color,border-radius,transform,box-shadow] duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-transparent focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--cobalt)] active:scale-95 disabled:cursor-not-allowed disabled:border-[color:var(--line-strong)] disabled:bg-[var(--slate-soft)] disabled:text-[var(--ink-500)] disabled:shadow-none disabled:[--flow-label:var(--ink-500)] disabled:hover:border-[color:var(--line-strong)] disabled:active:scale-100 motion-reduce:transition-none motion-reduce:active:scale-100",
    shapeClasses[shape],
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if ("href" in props && props.href !== undefined) {
    return (
      <Link className={flowClassName} style={flowStyle} {...props}>
        <FlowButtonContent text={text} />
      </Link>
    );
  }

  const { type = "button", ...buttonProps } = props;

  return (
    <button
      type={type}
      className={flowClassName}
      style={flowStyle}
      {...buttonProps}
    >
      <FlowButtonContent text={text} />
    </button>
  );
}
