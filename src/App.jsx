import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';
import SopList from './components/SopList';
import SopDesigner from './components/Designer/SopDesigner';
import SopTester from './components/Tester/SopTester';
import SettingsPage from './components/SettingsPage';
import ListCodesPage from './components/Admin/ListCodesPage';
import DocumentTypesPage from './components/Admin/DocumentTypesPage';
import EventsPage from './components/Admin/EventsPage';

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<SopList />} />
                <Route path="/designer/:id" element={<SopDesigner />} />
                <Route path="/tester/:id" element={<SopTester />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/admin/list-codes" element={<ListCodesPage />} />
                <Route path="/admin/document-types" element={<DocumentTypesPage />} />
                <Route path="/admin/events" element={<EventsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
