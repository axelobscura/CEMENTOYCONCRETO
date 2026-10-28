import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SITE } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — Calculadora y asistente de obra`,
    template: `%s · ${SITE.shortName}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: SITE.keywords,
  category: "construction",
  creator: SITE.shortName,
  publisher: SITE.shortName,
  alternates: { canonical: "/" },
  formatDetection: { telephone: false, email: false, address: false },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    locale: SITE.locale,
    url: "/",
    siteName: SITE.name,
    title: `${SITE.name} — Calculadora y asistente de obra`,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — Calculadora y asistente de obra`,
    description: SITE.description,
  },
};

export const viewport: Viewport = {
  themeColor: SITE.themeColor,
  colorScheme: "dark light",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE.name,
  url: SITE.url,
  description: SITE.description,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  inLanguage: "es",
  offers: { "@type": "Offer", price: "0", priceCurrency: "MXN" },
  featureList: [
    "Asistente con IA para mezclas, colado, curado y grietas",
    "Cálculo de bultos de cemento, arena, grava y agua",
    "Estimación de resistencia y tiempos de curado",
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\u003c") }}
        />
        {children}
      </body>
    </html>
  );
}
