import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import CustomScrollbar from "@/components/CustomScrollbar";
import localFont from "next/font/local";


const Melody = localFont({
  src: "./fonts/BLMelody-Bold.otf",
  variable: "--font-melody",
});
    

export const metadata: Metadata = {
  title: "Yadav History India",
  description: "All India Yadavs history articles, timeline, and image archive.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${Melody.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-melody tracking-tighter text-gray-900 bg-[#dedad7]">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <CustomScrollbar />
      </body>
    </html>
  );
}
