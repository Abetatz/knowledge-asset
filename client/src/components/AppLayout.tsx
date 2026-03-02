// ============================================================
// アプリレイアウト
// Design: Fixed sidebar (desktop) + Bottom nav (mobile)
// Sidebar: Dark indigo with tactical field background
// ============================================================

import { useLocation, Link } from "wouter";
import { LayoutDashboard, PlusCircle, BookOpen, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useKnowledgeContext } from "@/contexts/KnowledgeContext";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663394957210/g5vvgrrJvhAxa3DcmDEs6S/logo-icon-VwmbapbdhJ6xtDXosb6XSU.webp";
const SIDEBAR_BG_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663394957210/g5vvgrrJvhAxa3DcmDEs6S/sidebar-bg-HFhFMjdukd8g865efj9P6L.webp";

const NAV_ITEMS = [
  {
    path: "/dashboard",
    label: "ダッシュボード",
    icon: LayoutDashboard,
  },
  {
    path: "/form",
    label: "新規記録",
    icon: PlusCircle,
  },
];

function NavItem({
  path,
  label,
  icon: Icon,
  isActive,
  count,
}: {
  path: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  count?: number;
}) {
  return (
    <Link href={path}>
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 cursor-pointer",
          isActive
            ? "bg-white/15 text-white"
            : "text-indigo-200 hover:bg-white/10 hover:text-white"
        )}
      >
        <Icon className="w-5 h-5 shrink-0" />
        <span className="text-sm font-medium">{label}</span>
        {count !== undefined && (
          <span className="ml-auto bg-white/20 text-white text-xs rounded-full px-2 py-0.5">
            {count}
          </span>
        )}
      </div>
    </Link>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { totalCount } = useKnowledgeContext();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* デスクトップサイドバー */}
      <aside
        className="hidden lg:flex flex-col w-64 shrink-0 relative overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #1E1B4B 0%, #312E81 50%, #1E1B4B 100%)",
        }}
      >
        {/* 背景画像 */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url(${SIDEBAR_BG_URL})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        <div className="relative z-10 flex flex-col h-full">
          {/* ロゴ */}
          <div className="px-5 py-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <img
                src={LOGO_URL}
                alt="判断資産"
                className="w-10 h-10 rounded-xl"
              />
              <div>
                <h1 className="text-white font-bold text-sm leading-tight">判断資産</h1>
                <p className="text-indigo-300 text-xs">Knowledge Asset</p>
              </div>
            </div>
          </div>

          {/* ナビゲーション */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {NAV_ITEMS.map((item) => (
              <NavItem
                key={item.path}
                path={item.path}
                label={item.label}
                icon={item.icon}
                isActive={location === item.path || (item.path === "/dashboard" && location === "/")}
                count={item.path === "/dashboard" ? totalCount : undefined}
              />
            ))}
          </nav>

          {/* フッター */}
          <div className="px-5 py-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-xs text-indigo-300">LocalStorage 保存中</span>
            </div>
            <p className="text-xs text-indigo-400 mt-1">
              {totalCount} 件の判断資産
            </p>
          </div>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
        {children}
      </main>

      {/* モバイルボトムナビ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 shadow-lg">
        <div className="flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.map((item) => {
            const isActive =
              location === item.path ||
              (item.path === "/dashboard" && location === "/");
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={cn(
                    "flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all",
                    isActive ? "text-indigo-700" : "text-slate-400"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
