// ============================================================
// 判断資産（ナレッジ）管理システム - App.tsx
// Design: Field Command / War Room Aesthetic
// Routes: / → /dashboard, /form
// ============================================================

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { KnowledgeProvider } from "./contexts/KnowledgeContext";
import { AppLayout } from "./components/AppLayout";
import { SampleDataLoader } from "./components/SampleDataLoader";
import Dashboard from "./pages/Dashboard";
import EntryForm from "./pages/EntryForm";

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/">
          <Redirect to="/dashboard" />
        </Route>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/form" component={EntryForm} />
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
        <KnowledgeProvider>
          <SampleDataLoader />
          <TooltipProvider>
            <Toaster position="top-right" richColors />
            <Router />
          </TooltipProvider>
        </KnowledgeProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
