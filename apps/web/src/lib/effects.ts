/**
 * Catalogue of visual effects. All of them are free.
 * Implementations live in components/effects/.
 */

export interface EffectInfo {
  id: string;
  label: string;
}

export const TYPING_EFFECTS: EffectInfo[] = [
  { id: "none", label: "None" },
  { id: "typewriter", label: "Typewriter" },
  { id: "embers", label: "Embers" },
  { id: "glow", label: "Glow" },
  { id: "crunch", label: "Crunch" },
  { id: "explode", label: "Explode" },
  { id: "fireworks", label: "Fireworks" },
  { id: "shatter", label: "Shatter" },
  { id: "sparkle", label: "Sparkle" },
  { id: "burn", label: "Burn" },
  { id: "shock", label: "Shock" },
  { id: "float", label: "Float" },
  { id: "ink", label: "Ink" },
  { id: "corrupt", label: "Corrupt" },
  { id: "pixelate", label: "Pixelate" },
];

export const CURSOR_EFFECTS: EffectInfo[] = [
  { id: "none", label: "None" },
  { id: "afterimage", label: "Afterimage" },
  { id: "rainbow", label: "Rainbow" },
  { id: "sand", label: "Sand" },
  { id: "stardust", label: "Stardust" },
  { id: "bubbles", label: "Bubbles" },
  { id: "lightning", label: "Lightning" },
  { id: "flame", label: "Flame Trail" },
  { id: "fireflies", label: "Fireflies" },
  { id: "petals", label: "Petals" },
];

export const BACKGROUNDS: EffectInfo[] = [
  { id: "none", label: "None" },
  { id: "night-sky", label: "Night Sky" },
  { id: "snow", label: "Snow" },
  { id: "aurora", label: "Aurora" },
  { id: "rain", label: "Rain" },
  { id: "digital-rain", label: "Digital Rain" },
  { id: "underwater", label: "Underwater" },
  { id: "light-shafts", label: "Light Shafts" },
  { id: "candlelight", label: "Candlelight" },
  { id: "hearth", label: "Hearth" },
  { id: "crt", label: "CRT" },
];

/** Typing effects that are pure CSS animations on the typed character. */
export const CSS_TYPING_EFFECTS = new Set(["typewriter", "glow", "crunch", "float", "corrupt", "burn", "pixelate"]);
