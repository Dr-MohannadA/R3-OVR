import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthSimple } from "@/hooks/useAuthSimple";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import ReportIncident from "@/pages/report-incident";
import UserManagement from "@/pages/user-management";
import Register from "@/pages/register";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuthSimple();

  // While loading auth, show public routes
  if (isLoading) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/report" component={ReportIncident} />
        <Route path="/register" component={Register} />
        <Route path="/login" component={Login} />
        <Route path="/dashboard" component={() => {
          // Redirect to login if trying to access protected route without auth
          window.location.href = '/login';
          return null;
        }} />
        <Route path="/user-management" component={() => {
          // Redirect to login if trying to access protected route without auth
          window.location.href = '/login';
          return null;
        }} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={isAuthenticated ? Home : Landing} />
      <Route path="/report" component={ReportIncident} />
      <Route path="/register" component={isAuthenticated ? () => { window.location.href = '/'; return null; } : Register} />
      <Route path="/login" component={isAuthenticated ? () => { window.location.href = '/'; return null; } : Login} />
      <Route path="/dashboard" component={isAuthenticated ? Dashboard : () => { window.location.href = '/login'; return null; }} />
      <Route path="/user-management" component={isAuthenticated ? UserManagement : () => { window.location.href = '/login'; return null; }} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
