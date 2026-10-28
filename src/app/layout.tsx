import type { Metadata, Viewport } from "next";
import { CurtainProvider } from "@/components/layout/Curtain";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { fontVariables } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "KAIRO — Four lives. One label.",
    template: "%s · KAIRO",
  },
  description:
    "Kairo is an Ahmedabad menswear label: Streetwear, Formal, Old Money and Riding, cut to one standard. A concept brand by Jainam Gondaliya.",
  applicationName: "KAIRO",
};

export const viewport: Viewport = {
  themeColor: "#0B0B0C",
  colorScheme: "dark light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" data-theme="noir" className={fontVariables}>
      <body className="grain bg-background text-foreground">
        <SmoothScroll>
          <CurtainProvider>{children}</CurtainProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
