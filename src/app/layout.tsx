import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Manrope, Urbanist } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const urbanist = Urbanist({ variable: "--font-urbanist", subsets: ["latin"], weight: ["500", "600", "700"] });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: { default: "ScholarPath — Find the right scholarship", template: "%s · ScholarPath" },
  description:
    "Browse funding to study abroad by discipline, level, destination and university — then run a pre-submission check before you apply.",
};

export const viewport: Viewport = {
  themeColor: "#EDEFF2",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${urbanist.variable} ${manrope.variable} ${plexMono.variable}`}>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-pill bg-navy px-4 py-3 font-bold text-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3 hover:text-white"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="container-page w-full flex-1 pb-10">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
