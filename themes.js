const THEMES = ['default','neon'];

export const cycleTheme = (root, current) => {
  const idx = THEMES.indexOf(current);
  const next = THEMES[(idx+1)%THEMES.length];
  root.classList.toggle('theme-neon', next === 'neon');
  return next;
};

export const applyTheme = (root, theme) => {
  root.classList.toggle('theme-neon', theme === 'neon');
};
