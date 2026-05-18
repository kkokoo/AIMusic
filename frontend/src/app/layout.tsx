import type { Metadata } from "next";
import { Orbitron, Noto_Sans_SC, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Toast from "@/components/ui/Toast";
import AppLayout from "@/components/layout/AppLayout";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

const notoSansSC = Noto_Sans_SC({
  variable: "--font-sans-sc",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Music - AI音乐生成平台",
  description: "用AI创造你的声音",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${orbitron.variable} ${notoSansSC.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <body className="bg-space-900 min-h-full">
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
        <Toast />
      </body>
    </html>
  );
}