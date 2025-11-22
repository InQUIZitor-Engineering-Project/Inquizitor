import React, { type JSX } from "react";
import styled from "styled-components";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Navbar from "./components/Navbar/Navbar";

import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/RegisterPage/RegisterPage";
import LoginPage from "./pages/LoginPage/LoginPage";
import DashboardPage from "./pages/DashboardPage/DashboardPage";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import TestDetailPage from "./pages/TestDetailPage/TestDetailPage";
import AboutUsPage from './pages/AboutUsPage/AboutUsPage';
import FAQPage from './pages/FAQPage/FAQPage';
import CreateTestPage from "./pages/CreateTestPage/CreateTestPage";
import MainLayout from "./layouts/MainLayout";

import ScrollToTop from "./components/GeneralComponents/ScrollToTop/ScrollToTop";

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
  if (loading) return null; // możesz tu wstawić globalny loader
  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<HomePage />} />
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
                  <CreateTestPage />
                </ProtectedRoute>
              } 
            />
            <Route path="/tests/:testId" element={
              <ProtectedRoute>
                <TestDetailPage />
              </ProtectedRoute>
            }>
            </Route>
          </Route>
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
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<FallbackRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
