import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "X-Oauth",
    template: "%s | X-Oauth",
  },
  description: "一个更容易用的账号中心，支持邮箱登录、邮件登录、用设备登录、两步确认、密码找回和应用访问确认。",
  authors: [{ name: "X-Oauth" }],
  creator: "X-Oauth",
  publisher: "X-Oauth",
  openGraph: {
    title: "X-Oauth",
    siteName: "X-Oauth",
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
    <html lang="zh-CN" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
