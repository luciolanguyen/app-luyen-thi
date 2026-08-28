import * as React from "react";
import { cn } from "@/lib/utils";

/* ============================================================================
   Bộ component nền. Cố ý giữ nhỏ và không phụ thuộc thư viện ngoài:
   mọi màu đều lấy từ token trong globals.css, không có hex rời rạc trong JSX.
   ========================================================================== */

/* --------------------------------- Button -------------------------------- */
type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-on-primary hover:bg-primary-hover shadow-xs disabled:bg-muted-foreground",
  secondary:
    "bg-primary-soft text-primary hover:bg-secondary hover:text-on-secondary",
  outline:
    "border border-border-strong bg-card text-foreground hover:bg-primary-soft",
  ghost: "text-foreground hover:bg-primary-soft",
  danger: "bg-destructive text-on-destructive hover:bg-destructive-strong",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  // min-h-11 = 44px: ngưỡng vùng chạm tối thiểu trên mobile
  sm: "h-9 min-h-9 px-3 text-sm gap-1.5",
  md: "h-11 min-h-11 px-4 text-[0.9375rem] gap-2",
  lg: "h-12 min-h-12 px-6 text-base gap-2",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center rounded-md font-semibold",
        "transition-colors duration-200",
        "disabled:cursor-not-allowed disabled:opacity-60",
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className
      )}
      {...props}
    />
  );
}

/** Cùng diện mạo với Button nhưng render ra thẻ <a>.
 *  Dùng cho điều hướng — không bao giờ lồng <Link> bên trong <button>. */
export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string
) {
  return cn(
    "inline-flex cursor-pointer items-center justify-center rounded-md font-semibold",
    "transition-colors duration-200",
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    className
  );
}

/* ---------------------------------- Card --------------------------------- */
export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pb-3", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-lg font-bold tracking-tight text-balance", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("mt-1 text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}

/* --------------------------------- Badge --------------------------------- */
type BadgeTone =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "destructive";

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success-strong",
  warning: "bg-warning-soft text-warning",
  destructive: "bg-destructive-soft text-destructive-strong",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold",
        BADGE_TONES[tone],
        className
      )}
      {...props}
    />
  );
}

/* --------------------------------- Input --------------------------------- */
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-md border border-border-strong bg-card px-3 text-[0.9375rem]",
        "placeholder:text-muted-foreground",
        "transition-colors duration-200",
        "disabled:cursor-not-allowed disabled:bg-muted",
        "aria-[invalid=true]:border-destructive",
        className
      )}
      {...props}
    />
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        "h-11 w-full cursor-pointer rounded-md border border-border-strong bg-card px-3 text-[0.9375rem]",
        "transition-colors duration-200",
        className
      )}
      {...props}
    />
  );
});

/* --------------------------------- Label --------------------------------- */
export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-semibold", className)}
      {...props}
    />
  );
}

/* -------------------------------- Progress -------------------------------- */
export function Progress({
  value,
  max = 100,
  tone = "primary",
  className,
  label,
}: {
  value: number;
  max?: number;
  tone?: "primary" | "success" | "warning" | "destructive";
  className?: string;
  label?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const fill = {
    primary: "bg-primary",
    success: "bg-success-fill",
    warning: "bg-warning-fill",
    destructive: "bg-destructive",
  }[tone];

  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", fill)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* --------------------------------- Alert ---------------------------------- */
export function Alert({
  tone = "primary",
  title,
  children,
  className,
}: {
  tone?: "primary" | "success" | "warning" | "destructive";
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const tones = {
    primary: "border-primary bg-primary-soft text-primary",
    success: "border-success bg-success-soft text-success-strong",
    warning: "border-warning bg-warning-soft text-warning",
    destructive: "border-destructive bg-destructive-soft text-destructive-strong",
  }[tone];

  return (
    <div
      className={cn("rounded-md border-l-4 p-4 text-sm", tones, className)}
      role={tone === "destructive" ? "alert" : "status"}
    >
      {title && <p className="font-bold">{title}</p>}
      {children && <div className={cn(title && "mt-1")}>{children}</div>}
    </div>
  );
}

/* ------------------------------- Empty state ------------------------------ */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border-strong bg-card px-6 py-12 text-center">
      {icon && <div className="mb-3 text-muted-foreground">{icon}</div>}
      <p className="font-semibold">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* --------------------------------- Skeleton ------------------------------- */
export function Skeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      aria-hidden="true"
    />
  );
}
