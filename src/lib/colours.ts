import { colourKey } from "./filters";

/** Swatch colours for the filter bar. Two-tone names show both halves; unknown names fall back to grey. */
const HEX: Record<string, string | [string, string]> = {
  black: "#111111",
  bone: "#E6DFD0",
  "washed black": "#2B2B2D",
  concrete: "#9A9A96",
  olive: "#5B5E3A",
  white: "#F5F5F2",
  "washed grey": "#8C8F93",
  "raw indigo": "#22304F",
  navy: "#1D2742",
  "black and bone": ["#111111", "#E6DFD0"],
  charcoal: "#36383C",
  "midnight navy": "#151C33",
  "sky blue": "#A9C4DE",
  taupe: "#8D7F70",
  "pale pink": "#E8C9C6",
  burgundy: "#5E1F2A",
  camel: "#B8895A",
  oat: "#D9CDB4",
  "bottle green": "#1F3B2D",
  cream: "#EFE6D2",
  sand: "#CDB991",
  "ecru stripe": ["#EDE4D0", "#3B4A6B"],
  sage: "#9AA58A",
  stone: "#B5AD9F",
  khaki: "#A39566",
  "green and cream": ["#2C4A36", "#EFE6D2"],
  indigo: "#2E3A6E",
  graphite: "#3C3E42",
  "signal orange": "#E8833A",
  "black check": ["#111111", "#5A5A5A"],
};

export function swatch(colour: string): string {
  const v = HEX[colourKey(colour)] ?? "#808080";
  return Array.isArray(v) ? `linear-gradient(135deg, ${v[0]} 50%, ${v[1]} 50%)` : v;
}
