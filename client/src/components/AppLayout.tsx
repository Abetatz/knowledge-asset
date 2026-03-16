// ============================================================
// アプリレイアウト
// Design: Fixed sidebar (desktop) + Bottom nav (mobile)
// Sidebar: Dark indigo with tactical field background
// ============================================================

import { useLocation, Link } from "wouter";
import { LayoutDashboard, PlusCircle, BookOpen, Settings, LogOut, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useKnowledgeContext } from "@/contexts/KnowledgeContext";
import { useAuth } from "@/contexts/AuthContext";

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

const ADMIN_NAV_ITEMS = [
  {
    path: "/admin/users",
    label: "ユーザー管理",
    icon: Users,
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
  const [location, setLocation] = useLocation();
  const { totalCount } = useKnowledgeContext();
  const { logout, userEmail, userRole } = useAuth();

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

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
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
            {userRole === "admin" && (
              <>
                <div className="px-4 py-2 mt-4 border-t border-white/10">
                  <p className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">管理</p>
                </div>
                {ADMIN_NAV_ITEMS.map((item) => (
                  <NavItem
                    key={item.path}
                    path={item.path}
                    label={item.label}
                    icon={item.icon}
                    isActive={location === item.path}
                  />
                ))}
              </>
            )}
          </nav>

          {/* フッター */}
          <div className="px-5 py-4 border-t border-white/10 space-y-3">
            <div>
              <p className="text-xs text-indigo-300 truncate">{userEmail}</p>
              <p className="text-xs text-indigo-400 mt-1">
                {totalCount} 件の判断資産
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-indigo-200 hover:text-white transition-colors text-xs font-medium"
            >
              <LogOut className="w-4 h-4" />
              ログアウト
            </button>
          </div>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
        {children}
      </main>

      {/* モバイルボトムナビ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 shadow-lg overflow-x-auto">
        <div className="flex items-center justify-between px-2 py-2 min-w-min">
          <div className="flex items-center justify-around gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                location === item.path ||
                (item.path === "/dashboard" && location === "/");
              return (
                <Link key={item.path} href={item.path}>
                  <div
                    className={cn(
                      "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap",
                      isActive ? "text-indigo-700" : "text-slate-400"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </div>
                </Link>
              );
            })}
            {userRole === "admin" &&
              ADMIN_NAV_ITEMS.map((item) => {
                const isActive = location === item.path;
                return (
                  <Link key={item.path} href={item.path}>
                    <div
                      className={cn(
                        "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap",
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
          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all text-slate-400 hover:text-indigo-700 whitespace-nowrap"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-xs font-medium">ログアウト</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
