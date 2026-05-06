import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Cases from "./pages/Cases";
import CaseDetail from "./pages/CaseDetail";
import Appointments from "./pages/Appointments";
import Alerts from "./pages/Alerts";
import YouthProfiles from "./pages/YouthProfiles";
import YouthDetail from "./pages/YouthDetail";
import RiskMonitor from "./pages/RiskMonitor";
import AwarenessActions from "./pages/AwarenessActions";
import Reports from "./pages/Reports";
import AuditLog from "./pages/AuditLog";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/cases" element={<Cases />} />
              <Route path="/cases/:id" element={<CaseDetail />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/youth-profiles" element={<YouthProfiles />} />
              <Route path="/youth-profiles/:id" element={<YouthDetail />} />
              <Route path="/risk-monitor" element={<RiskMonitor />} />
              <Route path="/awareness-actions" element={<AwarenessActions />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/audit-log" element={<AuditLog />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
