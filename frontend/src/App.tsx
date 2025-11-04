import React, { type JSX } from "react";
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


const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tests/new" element={<CreateTestPage />} />
          <Route path="/tests/:testId" element={
            // <ProtectedRoute>
              <TestDetailPage />
            // </ProtectedRoute>
          }>
          </Route>
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
        </Routes>

      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
