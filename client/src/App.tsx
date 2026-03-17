// ============================================================
// 判断資産（ナレッジ）管理システム - App.tsx
// Design: Field Command / War Room Aesthetic
// Routes: / → /dashboard, /form, /login
// ============================================================

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { KnowledgeProvider } from "./contexts/KnowledgeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AppLayout } from "./components/AppLayout";
import { SampleDataLoader } from "./components/SampleDataLoader";
import { Dashboard } from "./pages/Dashboard";
import { EntryForm } from "./pages/EntryForm";
import { EntryDetail } from "./pages/EntryDetail";
import Login from "./pages/Login";
import UserManagement from "./pages/UserManagement";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-slate-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route>
          <Redirect to="/login" />
        </Route>
      </Switch>
    );
  }

  return (
    <AppLayout>
      <Switch>
        <Route path="/">
          <Redirect to="/dashboard" />
        </Route>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/form" component={EntryForm} />
        <Route path="/entry/:id" component={EntryDetail} />
        <Route path="/admin/users" component={UserManagement} />
        <Route>
          <Redirect to="/dashboard" />
        </Route>
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <KnowledgeProvider>
            <SampleDataLoader />
            <TooltipProvider>
              <Toaster position="top-right" richColors />
              <Router />
            </TooltipProvider>
          </KnowledgeProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
