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
  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    return <NotFound />; // Render NotFound directly
  }
  return <>{children}</>;
};

const LoginPage: React.FC = () => {
  const { login } = useWarehouse();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!login(username, password)) {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form onSubmit={handleSubmit} className="bg-card p-8 rounded shadow-md w-80 space-y-4">
        <h2 className="text-2xl font-bold mb-4 text-center">Sign In</h2>
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        <div>
          <label className="block mb-1">Username</label>
          <input className="w-full border rounded px-3 py-2" value={username} onChange={e => setUsername(e.target.value)} />
        </div>
        <div>
          <label className="block mb-1">Password</label>
          <input className="w-full border rounded px-3 py-2" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <button className="w-full bg-primary text-white py-2 rounded" type="submit">Login</button>
      </form>
    </div>
  );
};

const AppContent = () => {
  const { currentUser } = useWarehouse();
  if (!currentUser) {
    return <LoginPage />;
  }
  return (
    <>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RequireRole allowedRoles={['admin']}><Layout><Dashboard /></Layout></RequireRole>} />
          <Route path="/inventory" element={<RequireRole allowedRoles={['admin']}><Layout><InventoryPage /></Layout></RequireRole>} />
          <Route path="/stock-receive" element={<RequireRole allowedRoles={['admin','staff']}><Layout><StockReceivePage /></Layout></RequireRole>} />
          <Route path="/stock-transfer" element={<RequireRole allowedRoles={['admin','staff']}><Layout><StockTransferPage /></Layout></RequireRole>} />
          <Route path="/reports" element={<RequireRole allowedRoles={['admin']}><Layout><ReportsPage /></Layout></RequireRole>} />
          <Route path="/settings" element={<RequireRole allowedRoles={['admin']}><Layout><SettingsPage /></Layout></RequireRole>} />
          <Route path="/notfound" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
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
