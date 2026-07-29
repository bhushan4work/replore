import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";


const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  subsets: ["latin"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter", // Optional (recommended)
  display: "swap",
});

// export const metadata: Metadata = {
//   title: "Replore",
//   description: "",
//   metadataBase: new URL(""),
//   openGraph: {
//     title: "Replore",
//     description: "",
//     siteName: "Replore",
//     type: "website",
//   },
//   twitter: {
//     card: "summary_large_image",
//     title: "Replore",
//     description: "",
//   },
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable}`}
    >
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}