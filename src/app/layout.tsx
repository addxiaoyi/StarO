import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: {
    default: "StarX-Oauth",
    template: "%s | StarX-Oauth",
  },
  description: "一个更容易用的账号中心，支持邮箱登录、邮件登录、用设备登录、两步确认、密码找回和应用访问确认。",
  authors: [{ name: "StarX-Oauth" }],
  creator: "StarX-Oauth",
  publisher: "StarX-Oauth",
  openGraph: {
    title: "StarX-Oauth",
    siteName: "StarX-Oauth",
    description: "面向普通用户的极简账号中心。",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable}`} data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
