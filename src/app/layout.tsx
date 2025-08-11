import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import Script from "next/script";
import { Toaster } from "react-hot-toast";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Playtime!",
  description: "Musical memory game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <Script src="https://w.soundcloud.com/player/api.js" strategy="beforeInteractive" />
        </head>
        <body className={`${nunito.variable} antialiased`}>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                zIndex: "var(--z-toast)",
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
