import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Tabs } from "../ui";
import useReducedMotion from "../../hooks/useReducedMotion";
import { motionDurations } from "./motionTokens";

// Usa ui/Tabs para roles/keyboard; anima só o conteúdo do painel ativo.
export function AnimatedTabs({ tabs, activeValue, onValueChange, ariaLabel, className, style }) {
  const isReduced = useReducedMotion();

  // Passa tabs sem children para o Tabs (só tab list + keyboard nav)
  const tabsNav = tabs.map(({ children: _c, ...t }) => ({ ...t, children: null }));
  const activeTab = tabs.find((t) => t.value === activeValue);

  const panelInitial = isReduced ? { opacity: 0 } : { opacity: 0, y: 4 };
  const panelExit = isReduced ? { opacity: 0 } : { opacity: 0, y: -4 };

  return (
    <div className={className} style={style}>
      <Tabs
        tabs={tabsNav}
        activeValue={activeValue}
        onValueChange={onValueChange}
        ariaLabel={ariaLabel}
      />
      <AnimatePresence mode="wait">
        <motion.div
          key={activeValue}
          initial={panelInitial}
          animate={{ opacity: 1, y: 0 }}
          exit={panelExit}
          transition={{ duration: motionDurations.fast }}
        >
          {activeTab?.children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
