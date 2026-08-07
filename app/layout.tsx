import type { Metadata, Viewport } from "next";
import { Syne, Inter, JetBrains_Mono, Caveat, Zen_Old_Mincho } from "next/font/google";
import SmoothScroll from "@/providers/SmoothScroll";
import NewsBar from "@/components/chrome/NewsBar";
import CardNav from "@/components/chrome/CardNav";
import ScrollProgress from "@/components/chrome/ScrollProgress";
import "./globals.css";

/* Weights follow what the stylesheet actually asks for. Syne was shipping 800
   (used nowhere) while 500 and 600 were missing, so `.note .nt` and the card
   titles — the 600 tier the design leans on — were being matched up to 700 and
   losing the step down from a section heading. */
const syne = Syne({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--f-display" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "600"], variable: "--f-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--f-mono" });
const hand = Caveat({ subsets: ["latin"], weight: ["500", "600"], variable: "--f-hand" });
const mincho = Zen_Old_Mincho({ subsets: ["latin"], weight: ["400", "700", "900"], variable: "--f-serif" });

const TITLE = "Abhinav Pabbaraju — systems engineer";
const DESCRIPTION =
  "Systems-depth portfolio: distributed consensus, compiler backends, GPU physics, low-latency. Served nightly at the Systems Diner.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  metadataBase: new URL("https://abhinavpabbaraju.com"),
  applicationName: "Systems Diner",
  authors: [{ name: "Abhinav Pabbaraju", url: "https://github.com/AbhinavPabbaraju" }],
  creator: "Abhinav Pabbaraju",
  keywords: [
    "systems engineer", "distributed systems", "Raft consensus", "compiler backend",
    "x86-64", "GPU physics", "low-latency", "order book", "portfolio",
  ],
  alternates: { canonical: "/" },
  /* The link had no card of its own, so anywhere it was shared — LinkedIn,
     a DM — it rendered as a bare URL. `app/opengraph-image` supplies one. */
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Abhinav Pabbaraju",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
  robots: { index: true, follow: true },
};

/* `color-scheme: dark` is what tells the browser to render its own furniture
   dark — without it a near-black page scrolls against a light scrollbar. */
export const viewport: Viewport = { themeColor: "#0c141b", colorScheme: "dark" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${inter.variable} ${mono.variable} ${hand.variable} ${mincho.variable}`}
    >
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <SmoothScroll>
          <ScrollProgress />
          <NewsBar />
          <CardNav />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
