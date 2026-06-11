import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import useReducedMotion from "../../hooks/useReducedMotion";
import { motionDurations, motionEasing } from "./motionTokens";

// Wrapper fino de AnimatePresence para steps e troca de painéis.
export function MotionPresence({ children, mode = "wait" }) {
  return <AnimatePresence mode={mode}>{children}</AnimatePresence>;
}

// Componente de step individual — usar com MotionPresence e key único.
export function MotionStep({ stepKey, children, className, direction = 1 }) {
  const isReduced = useReducedMotion();
  const xOffset = 24 * direction;

  return (
    <motion.div
      key={stepKey}
      className={className}
      initial={isReduced ? { opacity: 0 } : { opacity: 0, x: xOffset }}
      animate={{ opacity: 1, x: 0 }}
      exit={isReduced ? { opacity: 0 } : { opacity: 0, x: -xOffset }}
      transition={{ duration: motionDurations.normal, ease: motionEasing.standard }}
    >
      {children}
    </motion.div>
  );
}
