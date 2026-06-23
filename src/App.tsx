/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Suspense, lazy } from 'react';
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { Layout } from "./components/layout/Layout";
import { AdminLayout } from "./components/layout/AdminLayout";

// Lazy-loaded pages (Performance: Code Splitting)
const Login = lazy(() => import("./pages/Login").then(module => ({ default: module.Login })));
const Dashboard = lazy(() => import("./pages/Dashboard").then(module => ({ default: module.Dashboard })));
const Predictions = lazy(() => import("./pages/Predictions").then(module => ({ default: module.Predictions })));
const Matches = lazy(() => import("./pages/Matches").then(module => ({ default: module.Matches })));
const GroupStandings = lazy(() => import("./pages/GroupStandings").then(module => ({ default: module.GroupStandings })));
const Leaderboard = lazy(() => import("./pages/Leaderboard").then(module => ({ default: module.Leaderboard })));

// Admin Pages
const UsersManager = lazy(() => import("./pages/admin/UsersManager").then(module => ({ default: module.UsersManager })));
const MatchesManager = lazy(() => import("./pages/admin/MatchesManager").then(module => ({ default: module.MatchesManager })));
const ResultsManager = lazy(() => import("./pages/admin/ResultsManager").then(module => ({ default: module.ResultsManager })));
const SettingsManager = lazy(() => import("./pages/admin/SettingsManager").then(module => ({ default: module.SettingsManager })));

const SuspenseFallback = () => (
  <div className="min-h-[100dvh] bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
  </div>
);

function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) {
  const { session, loading, userProfile } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center" dir="rtl">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && userProfile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  return (
    <Suspense fallback={<SuspenseFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/predictions" element={
        <ProtectedRoute>
          <Layout>
            <Predictions />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/matches" element={
        <ProtectedRoute>
          <Layout>
            <Matches />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/groups" element={
        <ProtectedRoute>
          <Layout>
            <GroupStandings />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/leaderboard" element={
        <ProtectedRoute>
          <Layout>
            <Leaderboard />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/admin" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="users" replace />} />
        <Route path="users" element={<UsersManager />} />
        <Route path="matches" element={<MatchesManager />} />
        <Route path="results" element={<ResultsManager />} />
        <Route path="settings" element={<SettingsManager />} />
      </Route>
      
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
          <Toaster position="top-center" toastOptions={{ duration: 4000, style: { background: '#333', color: '#fff', fontSize: '14px' } }} />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
