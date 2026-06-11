import React from "react";
import { motion } from "framer-motion";
import useReducedMotion from "../../hooks/useReducedMotion";

export function MotionButton({ children, className = "", onClick, type = "button", disabled, style, ...rest }) {
  const isReduced = useReducedMotion();

  return (
    <motion.button
      type={type}
      className={`med-focus-ring ${className}`}
      disabled={disabled}
      style={style}
      whileHover={!isReduced && !disabled ? { scale: 1.015 } : undefined}
      whileTap={!isReduced && !disabled ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.16 }}
      onClick={onClick}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
