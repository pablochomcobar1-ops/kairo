import { JetBrains_Mono, Manrope, Syncopate } from "next/font/google";

/** Display: wide caps for headlines and the wordmark. Not a variable font, so weights are listed. */
export const syncopate = Syncopate({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-syncopate",
});

/** Text: body copy, buttons, navigation. */
export const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

/** Labels, prices, sizes, timers. */
export const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
});

export const fontVariables = [syncopate.variable, manrope.variable, jetbrains.variable].join(" ");
