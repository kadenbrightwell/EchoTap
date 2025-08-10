const KEY = 'echotap_v2';
const DEFAULTS = {
  best: 0,
  volume: 0.9,
  haptics: true,
  highContrast: false,
  reduceMotion: false,
  theme: 'default'
};

export const load = () => {
  try{
    const raw = localStorage.getItem(KEY);
    if (!raw) return {...DEFAULTS};
    return {...DEFAULTS, ...JSON.parse(raw)};
  } catch { return {...DEFAULTS}; }
};

export const save = (state) => {
  try{
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
};
