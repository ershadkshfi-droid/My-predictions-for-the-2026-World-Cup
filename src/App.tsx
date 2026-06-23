/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Predictions } from "./pages/Predictions";
import { Matches } from "./pages/Matches";
import { GroupStandings } from "./pages/GroupStandings";
import { Login } from "./pages/Login";
import { Leaderboard } from "./pages/Leaderboard";

import { AdminLayout } from "./components/layout/AdminLayout";
import { UsersManager } from "./pages/admin/UsersManager";
import { MatchesManager } from "./pages/admin/MatchesManager";
import { ResultsManager } from "./pages/admin/ResultsManager";
import { SettingsManager } from "./pages/admin/SettingsManager";

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
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
