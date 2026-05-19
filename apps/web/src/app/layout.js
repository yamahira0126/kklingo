// レイアウト
import { Noto_Sans_JP } from "next/font/google";
import "../styles/globals.css";
import SidebarWithAuth from "../components/SidebarWithAuth";
import { AuthProvider } from '@/contexts/AuthContext';

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

export const metadata = {
  title: "KKlingo",
  description: "テスト対策問題自動生成アプリ",
  icons: {
    icon: "./favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja" className={notoSansJP.variable}>
      <body className="font-sans antialiased bg-white text-black">
        <AuthProvider>
          <div className="flex min-h-screen">
            <SidebarWithAuth  />
            <main className="flex-1 p-6">
              {children}
            </main>
         </div>
        </AuthProvider>
        
      </body>
    </html>
  );
}
