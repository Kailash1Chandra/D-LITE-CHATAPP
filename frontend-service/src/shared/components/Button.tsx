"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "type" | "disabled" | "children"> {
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  iconLeft,
  iconRight,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variantStyles = {
    primary:
      "bg-brand-500 text-white hover:bg-brand-600 focus:ring-brand-500 shadow-sm border border-brand-600",
    secondary:
      "bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--row-hover-bg)] border border-[var(--border)] focus:ring-[var(--brand-500)] shadow-sm",
    ghost: "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--row-hover-bg)] hover:text-[var(--text-primary)] focus:ring-[var(--brand-500)]",
    danger: "bg-danger text-white hover:bg-red-600 focus:ring-danger shadow-sm border border-red-600",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const disabledStyles = disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";

  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.05 }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${className}`}
      {...props}
    >
      {iconLeft && <span className="flex-shrink-0">{iconLeft}</span>}
      {children && <span>{children}</span>}
      {iconRight && <span className="flex-shrink-0">{iconRight}</span>}
    </motion.button>
  );
}
