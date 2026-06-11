import React from "react";
import { motion } from "framer-motion";
import useReducedMotion from "../../hooks/useReducedMotion";
import { motionDurations, motionEasing } from "./motionTokens";

export function MotionProgressBar({
  value = 0,
  className = "h-2 bg-white/5 rounded-full overflow-hidden",
  barClassName = "h-full rounded-full bg-gradient-to-r from-blue-500 to-sky-500",
  style,
  barStyle,
  title,
}) {
  const isReduced = useReducedMotion();
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div className={className} style={style} title={title}>
      <motion.div
        className={barClassName}
        initial={isReduced ? false : { width: 0 }}
        whileInView={{ width: `${safeValue}%` }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: motionDurations.normal, ease: motionEasing.standard }}
        style={barStyle}
      />
    </div>
  );
}
