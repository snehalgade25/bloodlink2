import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Stock from './pages/Stock';
import HospitalDetail from './pages/HospitalDetail';
import Camps from './pages/Camps';
import Donate from './pages/Donate';
import RequestBlood from './pages/RequestBlood';
import EmergencyRequests from './pages/EmergencyRequests';
import ManageStock from './pages/ManageStock';
import Layout from './components/Layout';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />

        {/* Protected Routes Wrapper */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/login" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="manage-stock" element={<ManageStock />} />
          <Route path="stock" element={<Stock />} />
          <Route path="hospital/:id" element={<HospitalDetail />} />
          <Route path="camps" element={<Camps />} />
          <Route path="donate" element={<Donate />} />
          <Route path="request" element={<RequestBlood />} />
          <Route path="emergency-requests" element={<EmergencyRequests />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
