// Shared animation presets — one orchestrated entrance per page, motion on interaction elsewhere.
export const ease = [0.22, 1, 0.36, 1];

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

export const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
};

export const pageExit = { opacity: 0, transition: { duration: 0.12 } };
