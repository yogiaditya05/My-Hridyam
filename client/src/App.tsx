import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import Home from "./pages/Home";
import Chat from "./pages/Chat";
import About from "./pages/About";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import Dashboard from "./pages/Dashboard";

import { Route, Switch } from "wouter";

import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  return (
    <Switch>
      {/* Home Page */}
      <Route path="/" component={Home} />

      {/* Login Page */}
      <Route path="/login" component={Login} />

      {/* Chat Page */}
      <Route path="/chat" component={Chat} />

      {/* About Page */}
      <Route path="/about" component={About} />

      {/* Admin Dashboard */}
      <Route path="/admin" component={AdminDashboard} />

      {/* User Dashboard */}
      <Route path="/dashboard" component={Dashboard} />

      {/* 404 Page */}
      <Route path="/404" component={NotFound} />

      {/* Fallback Route */}
      <Route component={Home} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;