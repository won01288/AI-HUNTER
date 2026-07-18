import type { Metadata } from "next";
import { Noto_Serif_KR, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// Pretendard는 Google Fonts에 없어 pretendard npm 패키지의 variable woff2를
// next/font/local로 직접 로드한다 (docs/design-guide.md 타이포그래피 참고).
const pretendard = localFont({
  src: "../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  variable: "--font-body",
  weight: "45 920",
  display: "swap",
});

const notoSerifKr = Noto_Serif_KR({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["500"],
});

export const metadata: Metadata = {
  title: "AI Hunter",
  description: "막연한 이직 고민에 정확한 좌표를 찍어드립니다",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${pretendard.variable} ${notoSerifKr.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper font-body text-ink">
        {children}
      </body>
    </html>
  );
}
