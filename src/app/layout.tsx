import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "./providers";
import { constructMetadata } from "@/lib/utils"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = constructMetadata()

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-pink-50 via-transparent to-orange-50`}
      >
        <PostHogProvider>
          {children}
        </PostHogProvider>
        
      </body>
    </html>
  );
}
