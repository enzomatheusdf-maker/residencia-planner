export const motionDurations = { fast: 0.16, normal: 0.28, slow: 0.45, page: 0.55 };
export const motionEasing = { standard: [0.22, 1, 0.36, 1], gentle: "easeOut" };

export const motionVariants = {
  fadeUp:  { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } },
  fadeIn:  { hidden: { opacity: 0 },        visible: { opacity: 1 } },
  scaleIn: { hidden: { opacity: 0, scale: 0.96 }, visible: { opacity: 1, scale: 1 } },
};

export const staggerParent = (stagger = 0.06, delayChildren = 0.04) => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren } },
});

// Para reduced-motion: só opacity, sem deslocamento.
export const reduced = () => ({
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
});
