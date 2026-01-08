import React, { type JSX } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";

import Navbar from "./components/Navbar/Navbar";

import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/RegisterPage/RegisterPage";
import LoginPage from "./pages/LoginPage/LoginPage";
import DashboardPage from "./pages/DashboardPage/DashboardPage";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import TestDetailPage from "./pages/TestDetailPage/TestDetailPage";
import AboutUsPage from './pages/AboutUsPage/AboutUsPage';
import FAQPage from './pages/FAQPage/FAQPage';
import CreateTestSelectionPage from "./pages/CreateTestSelectionPage/CreateTestSelectionPage";
import CreateTestAIPage from "./pages/CreateTestAIPage/CreateTestAIPage";
import CreateManualTestPage from "./pages/CreateManualTestPage/CreateManualTestPage";
import MainLayout from "./layouts/MainLayout";
import PublicLayout from "./layouts/PublicLayout";
import VerifyEmailPage from "./pages/VerifyEmailPage/VerifyEmailPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage/ResetPasswordPage";

import ScrollToTop from "./components/ScrollToTop/ScrollToTop";

const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return null; 
  }
  return user ? children : <Navigate to="/login" replace />;
};

const PublicOnlyRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return null;
  }
  return user ? <Navigate to="/dashboard" replace /> : children;
};

const FallbackRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <ScrollToTop />
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutUsPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route 
              path="/register" 
              element={
                <PublicOnlyRoute>
                  <RegisterPage />
                </PublicOnlyRoute>
              } 
            />
            <Route 
              path="/login" 
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              }
            />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route 
              path="/forgot-password" 
              element={
                <PublicOnlyRoute>
                  <ForgotPasswordPage />
                </PublicOnlyRoute>
              } 
            />
            <Route 
              path="/reset-password" 
              element={
                <PublicOnlyRoute>
                  <ResetPasswordPage />
                </PublicOnlyRoute>
              } 
            />
          </Route>

          <Route path="/" element={<MainLayout />}>
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tests/new" 
              element={
                <ProtectedRoute>
                  <CreateTestSelectionPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tests/new/ai" 
              element={
                <ProtectedRoute>
                  <CreateTestAIPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tests/new/manual" 
              element={
                <ProtectedRoute>
                  <CreateManualTestPage />
                </ProtectedRoute>
              } 
            />
            <Route path="/tests/:testId" element={
              <ProtectedRoute>
                <TestDetailPage />
              </ProtectedRoute>
            }>
            </Route>
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<FallbackRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
