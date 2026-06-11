import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import useReducedMotion from "../../hooks/useReducedMotion";
import { motionDurations, motionEasing } from "./motionTokens";

export function AnimatedAccordion({ items = [], className, itemClassName, headerClassName }) {
  const [open, setOpen] = useState({});
  const isReduced = useReducedMotion();

  const toggle = (value) => setOpen((prev) => ({ ...prev, [value]: !prev[value] }));

  return (
    <div className={className}>
      {items.map(({ value, label, children }) => {
        const isOpen = !!open[value];
        return (
          <div key={value} className={itemClassName}>
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={`accordion-panel-${value}`}
              id={`accordion-header-${value}`}
              className={`med-focus-ring flex w-full items-center justify-between gap-3 text-left ${headerClassName || ""}`}
              onClick={() => toggle(value)}
            >
              <span>{label}</span>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: motionDurations.fast }}
                style={{ display: "flex", flexShrink: 0 }}
              >
                <ChevronDown size={18} />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`accordion-panel-${value}`}
                  role="region"
                  aria-labelledby={`accordion-header-${value}`}
                  initial={isReduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={isReduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: motionDurations.normal, ease: motionEasing.gentle }}
                  style={{ overflow: "hidden" }}
                >
                  {children}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
