import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WarehouseProvider, useWarehouse } from "./context/WarehouseContext";
import { Sidebar } from "./components/Layout/Sidebar";
import { Header } from "./components/Layout/Header";
import { Dashboard } from "./components/Dashboard/Dashboard";
import InventoryPage from "./pages/InventoryPage";
import StockReceivePage from "./pages/StockReceivePage";
import StockTransferPage from "./pages/StockTransferPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import React, { useState } from 'react';
import SetPasswordPage from './pages/SetPasswordPage';
import { supabase } from '@/integrations/supabase/client';

const queryClient = new QueryClient();

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-background">
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  </div>
);

// Role-based route protection
const RequireRole = ({ allowedRoles, children }: { allowedRoles: string[]; children: React.ReactNode }) => {
  const { currentUser } = useWarehouse();
  console.log('RequireRole: currentUser', currentUser);
  if (!currentUser) {
    return <NotFound />;
  }
  if (!allowedRoles.includes(currentUser.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-card p-8 rounded shadow-md w-96 space-y-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="mb-4">Your account does not have permission to view this page.<br/>Role: <b>{currentUser.role}</b></p>
          <a href="/" className="text-blue-500 underline">Return to Home</a>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

const LoginPage: React.FC = () => {
  const { login } = useWarehouse();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResetMsg('');
    const success = await login(email, password);
    if (!success) {
      setError('Invalid email or password, or your account does not have access.');
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    const userEmail = prompt('Enter your email to reset your password:');
    if (!userEmail) return;
    const { error } = await supabase.auth.resetPasswordForEmail(userEmail);
    if (error) {
      setResetMsg('Failed to send reset email: ' + error.message);
    } else {
      setResetMsg('Password reset email sent! Please check your inbox.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center animated-gradient-bg">
      <form onSubmit={handleSubmit} className="login-card-animate bg-white/20 backdrop-blur-md p-8 rounded-3xl shadow-2xl w-80 space-y-6 border border-white/30">
        <h2 className="text-3xl font-extrabold mb-4 text-center text-white drop-shadow-lg tracking-wide">Welcome back</h2>
        {error && <div className="text-red-400 text-sm text-center font-semibold">{error}</div>}
        {resetMsg && <div className="text-green-400 text-sm text-center font-semibold">{resetMsg}</div>}
        <div>
          <label className="block mb-1 text-white font-medium">Email</label>
          <input className="w-full border border-white/30 rounded-full px-4 py-2 bg-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all duration-200" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Enter your email" />
        </div>
        <div>
          <label className="block mb-1 text-white font-medium">Password</label>
          <input className="w-full border border-white/30 rounded-full px-4 py-2 bg-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Enter your password" />
        </div>
        <button className="w-full py-2 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-bold shadow-lg hover:scale-105 hover:from-pink-400 hover:to-blue-400 transition-all duration-200" type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
        <div className="text-center mt-2">
          <button type="button" className="text-blue-200 underline text-sm hover:text-white" onClick={handleForgotPassword}>Forgot Password?</button>
        </div>
      </form>
    </div>
  );
};

const AppContent = () => {
  const { currentUser } = useWarehouse();
  return (
    <>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {!currentUser && (
            <Route path="*" element={<LoginPage />} />
          )}
          {currentUser && currentUser.must_set_password && (
            <Route path="*" element={<SetPasswordPage />} />
          )}
          {currentUser && !currentUser.must_set_password && (
            <>
              <Route path="/" element={<RequireRole allowedRoles={['admin', 'staff']}><Layout><Dashboard /></Layout></RequireRole>} />
              <Route path="/inventory" element={<RequireRole allowedRoles={['admin', 'staff']}><Layout><InventoryPage /></Layout></RequireRole>} />
              <Route path="/stock-receive" element={<RequireRole allowedRoles={['admin','staff']}><Layout><StockReceivePage /></Layout></RequireRole>} />
              <Route path="/stock-transfer" element={<RequireRole allowedRoles={['admin','staff']}><Layout><StockTransferPage /></Layout></RequireRole>} />
              <Route path="/reports" element={<RequireRole allowedRoles={['admin', 'staff']}><Layout><ReportsPage /></Layout></RequireRole>} />
              <Route path="/settings" element={<RequireRole allowedRoles={['admin', 'staff']}><Layout><SettingsPage /></Layout></RequireRole>} />
              <Route path="/set-password" element={<SetPasswordPage />} />
              <Route path="/notfound" element={<NotFound />} />
              <Route path="*" element={<NotFound />} />
            </>
          )}
        </Routes>
      </BrowserRouter>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <WarehouseProvider>
        <AppContent />
      </WarehouseProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
