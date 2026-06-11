import React from "react";
import { motion } from "framer-motion";
import useReducedMotion from "../../hooks/useReducedMotion";
import { motionDurations, motionEasing, motionVariants, staggerParent, reduced } from "./motionTokens";

export function MotionSection({ as = "section", stagger = 0.06, className, children, style, ...rest }) {
  const isReduced = useReducedMotion();
  const MotionTag = motion[as] || motion.div;

  const containerVariants = isReduced ? { hidden: {}, visible: {} } : staggerParent(stagger);
  const itemVariants = isReduced ? reduced() : motionVariants.fadeUp;
  const itemTransition = { duration: motionDurations.slow, ease: motionEasing.standard };

  return (
    <MotionTag
      className={className}
      style={style}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      {...rest}
    >
      {React.Children.toArray(children).map((child, index) =>
        child ? (
          <motion.div key={child.key ?? index} variants={itemVariants} transition={itemTransition}>
            {child}
          </motion.div>
        ) : child
      )}
    </MotionTag>
  );
}
