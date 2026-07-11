import React, { lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import BottomNav from './components/BottomNav';
import Notifications from './components/Notifications';
import LoadingSpinner from './components/LoadingSpinner';
import PhotoSearchPage from './pages/PhotoSearchPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import './App.css';

// Lazy loading для страниц
const HomePage = lazy(() => import('./pages/HomePage'));
const MastersPage = lazy(() => import('./pages/MastersPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const CabinetPage = lazy(() => import('./pages/CabinetPage'));
const MasterPanelPage = lazy(() => import('./pages/MasterPanelPage'));
const MasterSchedulePage = lazy(() => import('./pages/MasterSchedulePage'));
const MasterProfilePage = lazy(() => import('./pages/MasterProfilePage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const RegisterMasterPage = lazy(() => import('./pages/RegisterMasterPage'));
const ClientProfilePage = lazy(() => import('./pages/ClientProfilePage'));

function App() {
  const { user, isAuthenticated } = useAuth();

  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          <div className="app-container">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
              {/* Публичные маршруты */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/register-master" element={<RegisterMasterPage />} />
              <Route
                path="/client-profile"
                element={
                  <ProtectedRoute>
                    <ClientProfilePage />
                  </ProtectedRoute>
                }
              />
              {/* Защищённые маршруты */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/photo-search"
                element={
                  <ProtectedRoute>
                    <PhotoSearchPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/masters"
                element={
                  <ProtectedRoute>
                    <MastersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/calendar"
                element={
                  <ProtectedRoute>
                    <CalendarPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cabinet"
                element={
                  <ProtectedRoute>
                    <CabinetPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/favorites"
                element={
                  <ProtectedRoute>
                    <FavoritesPage />
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

              {/* Маршруты мастера */}
              <Route
                path="/master-panel"
                element={
                  <ProtectedRoute requiredRole="master">
                    <MasterPanelPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/schedule"
                element={
                  <ProtectedRoute requiredRole="master">
                    <MasterSchedulePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute requiredRole="master">
                    <MasterProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Админ маршруты */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          
          {isAuthenticated && (
            <>
              <Notifications />
              <BottomNav />
            </>
          )}
        </div>
      </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;