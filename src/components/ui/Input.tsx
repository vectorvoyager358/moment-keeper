import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/cn";

export const fieldClassName =
  "w-full rounded-xl border border-border-strong bg-surface-elevated px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/20";

type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn("text-sm font-medium text-ink", className)}
      {...props}
    />
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return <input className={cn(fieldClassName, className)} {...props} />;
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(fieldClassName, "resize-y", className)}
      {...props}
    />
  );
}

type FieldHintProps = {
  children: ReactNode;
  className?: string;
};

export function FieldHint({ children, className }: FieldHintProps) {
  return <p className={cn("text-xs text-muted", className)}>{children}</p>;
}
