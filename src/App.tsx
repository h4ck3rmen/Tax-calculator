import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Employees from './pages/Employees';
import Dependents from './pages/Dependents';
import TaxCalculator from './pages/TaxCalculator';
import History from './pages/History';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth();
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Employees />} />
            <Route path="/dependents" element={<Dependents />} />
            <Route path="/tax-calc" element={<TaxCalculator />} />
            <Route path="/history" element={<History />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
