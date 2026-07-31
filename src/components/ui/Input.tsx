import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/cn";

export const fieldClassName =
  "min-h-11 w-full rounded-xl border border-border bg-surface-elevated px-3.5 py-2.5 text-base text-ink outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/20 sm:text-sm";

type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn("text-sm font-semibold text-muted", className)}
      {...props}
    />
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return <input className={cn(fieldClassName, className)} {...props} />;
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, ...props }: SelectProps) {
  return <select className={cn(fieldClassName, className)} {...props} />;
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
  id?: string;
};

export function FieldHint({ children, className, id }: FieldHintProps) {
  return (
    <p id={id} className={cn("text-xs text-muted", className)}>
      {children}
    </p>
  );
}
