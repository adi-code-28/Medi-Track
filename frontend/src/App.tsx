import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { Layout } from "@/components/Layout";
import { ProtectedRoute, PublicRoute } from "@/components/ProtectedRoute";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import VitalsPage from "@/pages/VitalsPage";
import MedicinesPage from "@/pages/MedicinesPage";
import SymptomsPage from "@/pages/SymptomsPage";
import ScanPage from "@/pages/ScanPage";
import AIPage from "@/pages/AIPage";
import ReportPage from "@/pages/ReportPage";
import ProfilePage from "@/pages/ProfilePage";
import SOSPage from "@/pages/SOSPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />
            <Route path="/sos/:userId" element={<SOSPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/vitals" element={<VitalsPage />} />
              <Route path="/medicines" element={<MedicinesPage />} />
              <Route path="/symptoms" element={<SymptomsPage />} />
              <Route path="/scan" element={<ScanPage />} />
              <Route path="/ai" element={<AIPage />} />
              <Route path="/report" element={<ReportPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
