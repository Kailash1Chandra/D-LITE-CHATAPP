"use client";

import React, { useState } from "react";
import { motion, HTMLMotionProps, AnimatePresence } from "framer-motion";

export interface IconButtonProps extends Omit<HTMLMotionProps<"button">, "type" | "disabled" | "children"> {
  children?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  tooltip?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "ghost";
}

export function IconButton({
  children,
  size = "md",
  tooltip,
  disabled,
  className = "",
  variant = "ghost",
  ...props
}: IconButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const sizeStyles = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const variantStyles = {
    primary: "bg-brand-500 text-white hover:bg-brand-600 shadow-sm",
    secondary: "bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--row-hover-bg)]",
    ghost: "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--row-hover-bg)] hover:text-[var(--text-primary)]",
  };

  const disabledStyles = disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";

  return (
    <div className="relative inline-block" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <motion.button
        whileHover={disabled ? undefined : { scale: 1.1 }}
        whileTap={disabled ? undefined : { scale: 0.9 }}
        disabled={disabled}
        className={`flex items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${sizeStyles[size]} ${variantStyles[variant]} ${disabledStyles} ${className}`}
        {...props}
      >
        {children}
      </motion.button>
      
      <AnimatePresence>
        {tooltip && isHovered && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-xs rounded whitespace-nowrap z-50 pointer-events-none shadow-sm"
            style={{ background: "var(--text-primary)", color: "var(--canvas-solid, #fff)" }}
          >
            {tooltip}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
