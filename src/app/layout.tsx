import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://caroline-trenzas.vercel.app"),
  title: "Caroline Trenzas - Trenzas a Domicilio en San Bernardo",
  description: "Trenzas y peinados profesionales a domicilio en San Bernardo.",
  openGraph: {
    title: "Caroline Trenzas",
    description: "Trenzas y peinados profesionales a domicilio en San Bernardo.",
    url: "https://caroline-trenzas.vercel.app",
    siteName: "Caroline Trenzas",
    images: [
      {
        url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCy9DUi6lA5ZHHte8ccfLdh4e_v_youhN1lWUWRqvze1PmDzputL9PRIuvkWX7yTkt-YLDAUSaV2uEZgot5tugnqaVFkhTLGlB3FeLQJtuH-PHT861-PSfj2f89Kkx3EnhZ3hiKQu9zsmAe34HKRC7cpskyunvK8VP5Cg1Icuv_O_apE9oEkVVdGved3sGo6BUKyE4fmRvFxsCuY7xRen31FMTKbX1eVq1Li4CgNe_gP0iixvezHHzor_7ppYaauqY46-eOQTV583Q5",
        width: 1200,
        height: 630,
        alt: "Caroline Trenzas",
      },
    ],
    locale: "es_CL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Caroline Trenzas",
    description: "Trenzas y peinados profesionales a domicilio en San Bernardo.",
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCy9DUi6lA5ZHHte8ccfLdh4e_v_youhN1lWUWRqvze1PmDzputL9PRIuvkWX7yTkt-YLDAUSaV2uEZgot5tugnqaVFkhTLGlB3FeLQJtuH-PHT861-PSfj2f89Kkx3EnhZ3hiKQu9zsmAe34HKRC7cpskyunvK8VP5Cg1Icuv_O_apE9oEkVVdGved3sGo6BUKyE4fmRvFxsCuY7xRen31FMTKbX1eVq1Li4CgNe_gP0iixvezHHzor_7ppYaauqY46-eOQTV583Q5",
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={manrope.variable}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@100..700&display=swap"
        />
      </head>

      <body className="bg-background-light dark:bg-background-dark text-[#181113] antialiased font-display">
        {children}

        <Script
          src="https://widget.cloudinary.com/v2.0/global/all.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
