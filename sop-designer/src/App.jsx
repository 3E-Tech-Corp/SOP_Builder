import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import SopList from './components/SopList';
import SopDesigner from './components/Designer/SopDesigner';
import SopTester from './components/Tester/SopTester';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<SopList />} />
        <Route path="/designer/:id" element={<SopDesigner />} />
        <Route path="/tester/:id" element={<SopTester />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
