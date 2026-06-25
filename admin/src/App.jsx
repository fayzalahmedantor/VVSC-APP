import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Due from './pages/Due';
import Mechanics from './pages/Mechanics';
import Suppliers from './pages/Suppliers';
import Report from './pages/Report';
import Settings from './pages/Settings';
import SmsSettings from './pages/SmsSettings';
import Expenses from './pages/Expenses';
import Loyalty from './pages/Loyalty';
import PrivateRoute from './components/layout/PrivateRoute';
import { AuthProvider } from './context/AuthContext';
import ReloadPrompt from './components/common/ReloadPrompt';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="customers" element={<Customers />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="mechanics" element={<PrivateRoute adminOnly={true}><Mechanics /></PrivateRoute>} />
            <Route path="due" element={<Due />} />
            <Route path="expenses" element={<PrivateRoute adminOnly={true}><Expenses /></PrivateRoute>} />
            <Route path="suppliers" element={<PrivateRoute adminOnly={true}><Suppliers /></PrivateRoute>} />
            <Route path="loyalty" element={<Loyalty />} />
            <Route path="report" element={<PrivateRoute adminOnly={true}><Report /></PrivateRoute>} />
            <Route path="settings" element={<PrivateRoute adminOnly={true}><Settings /></PrivateRoute>} />
            <Route path="sms-settings" element={<PrivateRoute adminOnly={true}><SmsSettings /></PrivateRoute>} />
          </Route>
        </Routes>
        <ReloadPrompt />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
