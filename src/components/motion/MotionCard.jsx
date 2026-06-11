import React from "react";
import { motion } from "framer-motion";
import useReducedMotion from "../../hooks/useReducedMotion";
import { motionDurations, motionEasing, motionVariants, reduced } from "./motionTokens";

export function MotionCard({ as = "div", interactive = true, className, style, children, ...rest }) {
  const isReduced = useReducedMotion();
  const MotionTag = motion[as] || motion.div;

  // Hover desabilitado em touch (pointer: coarse) via CSS, e em reduced-motion.
  const hoverProps = interactive && !isReduced
    ? { whileHover: { y: -3, scale: 1.01 }, whileTap: { scale: 0.98 } }
    : {};

  return (
    <MotionTag
      className={className}
      style={style}
      variants={isReduced ? reduced() : motionVariants.fadeUp}
      transition={{ duration: motionDurations.slow, ease: motionEasing.standard }}
      {...hoverProps}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
