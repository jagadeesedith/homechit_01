import { Routes, Route } from 'react-router-dom';
import { ChitFundProvider } from '@/context/ChitFundContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { MonthlySummaryPage } from '@/pages/MonthlySummaryPage';
import { MemberHistoryPage } from '@/pages/MemberHistoryPage';
import { DistributionPage } from '@/pages/DistributionPage';
import { MemberListPage } from '@/pages/MemberListPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { Toaster } from '@/components/ui/sonner';

export default function App() {
  return (
    <ChitFundProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/monthly-summary"
          element={
            <ProtectedRoute>
              <MonthlySummaryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/member-history"
          element={
            <ProtectedRoute>
              <MemberHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/distribution"
          element={
            <ProtectedRoute>
              <DistributionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/members"
          element={
            <ProtectedRoute>
              <MemberListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster
        position="top-center"
        richColors
        closeButton
        toastOptions={{
          classNames: {
            toast: "rounded-xl border shadow-[0_18px_40px_rgba(15,23,42,0.14)]",
            actionButton: "rounded-lg",
            cancelButton: "rounded-lg",
          },
        }}
      />
    </ChitFundProvider>
  );
}
