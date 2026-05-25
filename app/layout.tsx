import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import MobileNav from "@/components/MobileNav";
import { cn } from "@/lib/utils";
import { Wrench } from "lucide-react";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "그린설비",
  description: "도배 및 집수리 견적 관리 전문 시스템",
  other: { 'apple-mobile-web-app-capable': 'yes' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={cn("h-full antialiased", inter.variable)}>
      <body className="h-full font-sans" style={{ background: '#f7f7f7', color: '#171717' }}>
        <div className="flex h-screen overflow-hidden">
          {/* 데스크탑 사이드바 — 100vh sticky, 내부 스크롤 */}
          <aside className="hidden md:flex shrink-0" style={{ height: '100vh', position: 'sticky', top: 0, overflow: 'hidden' }}>
            <Navigation />
          </aside>

          {/* 메인 영역 */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0">
            {/* 모바일 헤더 — sticky로 스크롤 시에도 고정 */}
            <header className="md:hidden sticky top-0 z-50 bg-white border-b border-[#e8e8e8] px-5 h-14 flex items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <div
                  className="h-7 w-7 flex items-center justify-center"
                  style={{ background: '#3ecf8e', borderRadius: 6 }}
                >
                  <Wrench size={14} color="#171717" strokeWidth={2.5} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.2px' }}>그린설비</span>
              </div>
            </header>

            {/* 콘텐츠 — 모바일에서 하단 탭바 높이(64px)만큼 패딩 */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 p-5 md:p-8" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
              <Providers>{children}</Providers>
            </main>
          </div>
        </div>

        {/* 모바일 하단 탭 */}
        <MobileNav />
      </body>
    </html>
  );
}
