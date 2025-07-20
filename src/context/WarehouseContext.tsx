import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { useSupabase, Product as SupabaseProduct, Supplier as SupabaseSupplier, StockReceipt as SupabaseStockReceipt, StockTransfer as SupabaseStockTransfer } from '@/hooks/useSupabase';
import { supabase } from '@/integrations/supabase/client';

// Types - Updated to match Supabase schema
export interface Product {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  quantity: number;
  stock_alert: number;
  unit: string;
  supplier_id?: string;
  created_at: string;
  updated_at: string;
}

export interface StockReceipt {
  id: string;
  supplier_name: string;
  product_id: string;
  product_name: string;
  quantity: number;
  date: string;
  notes?: string;
  received_by?: string;
  supplier_id?: string;
  created_at: string;
  updated_at: string;
}

export interface StockTransfer {
  id: string;
  receiver_name: string;
  product_id: string;
  product_name: string;
  quantity: number;
  date: string;
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  notes?: string;
  transferred_by?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'staff';
  permissions?: string[];
  created_at: string;
  user_id: string;
  last_login?: string;
  updated_at: string;
  must_set_password?: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

interface WarehouseContextType {
  // Data
  products: Product[];
  stockReceipts: StockReceipt[];
  stockTransfers: StockTransfer[];
  users: User[];
  suppliers: Supplier[];
  currentUser: User | null;
  loading: boolean;
  
  // Products
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProduct: (id: string) => Product | undefined;
  getLowStockProducts: () => Product[];
  
  // Stock Receipts
  addStockReceipt: (receipt: Omit<StockReceipt, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  getStockReceipts: () => StockReceipt[];
  
  // Stock Transfers
  addStockTransfer: (transfer: Omit<StockTransfer, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTransferStatus: (id: string, status: StockTransfer['status']) => Promise<void>;
  getStockTransfers: () => StockTransfer[];
  
  // Users
  addUser: (user: Omit<User, 'id' | 'created_at' | 'updated_at'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  
  // Suppliers
  addSupplier: (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  
  // Utilities
  refreshData: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

export const useWarehouse = () => {
  const context = useContext(WarehouseContext);
  if (!context) {
    throw new Error('useWarehouse must be used within a WarehouseProvider');
  }
  return context;
};

// Remove sample data as we're using Supabase now

export const WarehouseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [stockReceipts, setStockReceipts] = useState<StockReceipt[]>([]);
  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Supabase hook
  const supabaseHook = useSupabase();

  // Fetch all users from Supabase profiles table
  const fetchAllUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return [];
    }
    return (data || []).map((profile: any) => ({
      id: profile.id,
      username: profile.username,
      email: profile.email,
      role: (profile.role === 'admin' ? 'admin' : 'staff') as User['role'],
      permissions: profile.permissions,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      user_id: profile.user_id,
      last_login: profile.last_login,
      must_set_password: profile.must_set_password,
    }));
  };

  // Load data from Supabase on mount
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();
        if (!profile) {
          // No profile found, do not set currentUser
          return;
        }
        setCurrentUser({
          id: profile.id,
          username: profile.username,
          email: profile.email,
          role: (profile.role === 'admin' ? 'admin' : 'staff'),
          permissions: profile.permissions,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          user_id: profile.user_id,
          last_login: profile.last_login,
          must_set_password: profile.must_set_password,
        });
      }
    })();
    refreshData();
  }, []);

  const refreshData = async () => {
    const [productsData, suppliersData, receiptsData, transfersData, usersData] = await Promise.all([
      supabaseHook.fetchProducts(),
      supabaseHook.fetchSuppliers(),
      supabaseHook.fetchStockReceipts(),
      supabaseHook.fetchStockTransfers(),
      fetchAllUsers()
    ]);

    setProducts(productsData);
    setSuppliers(suppliersData);
    setStockReceipts(receiptsData);
    setStockTransfers(transfersData);
    setUsers(usersData);
  };

  // Remove localStorage effects as we're using Supabase now

  // Product functions
  const addProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    const result = await supabaseHook.addProduct(productData);
    if (result) {
      setProducts(prev => [...prev, result]);
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const result = await supabaseHook.updateProduct(id, updates);
    if (result) {
      setProducts(prev => prev.map(product => 
        product.id === id ? result : product
      ));
    }
  };

  const deleteProduct = async (id: string) => {
    const success = await supabaseHook.deleteProduct(id);
    if (success) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const getProduct = (id: string) => products.find(p => p.id === id);

  const getLowStockProducts = () => products.filter(p => p.quantity <= p.stock_alert);

  // Stock Receipt functions
  const addStockReceipt = async (receiptData: Omit<StockReceipt, 'id' | 'created_at' | 'updated_at'>) => {
    const result = await supabaseHook.addStockReceipt(receiptData);
    if (result) {
      setStockReceipts(prev => [...prev, result]);
      // Refresh products to get updated quantities (handled by database triggers)
      const updatedProducts = await supabaseHook.fetchProducts();
      setProducts(updatedProducts);
    }
  };

  const getStockReceipts = () => stockReceipts;

  // Stock Transfer functions
  const addStockTransfer = async (transferData: Omit<StockTransfer, 'id' | 'created_at' | 'updated_at'>) => {
    const product = getProduct(transferData.product_id);
    if (!product || product.quantity < transferData.quantity) {
      toast({
        title: "Transfer Failed",
        description: "Insufficient stock for this transfer.",
        variant: "destructive"
      });
      return;
    }

    const result = await supabaseHook.addStockTransfer(transferData);
    if (result) {
      setStockTransfers(prev => [...prev, result]);
      // Refresh products to get updated quantities if transfer was completed
      if (transferData.status === 'completed') {
        const updatedProducts = await supabaseHook.fetchProducts();
        setProducts(updatedProducts);
      }
    }
  };

  const updateTransferStatus = async (id: string, status: StockTransfer['status']) => {
    const result = await supabaseHook.updateStockTransfer(id, { status });
    if (result) {
      setStockTransfers(prev => prev.map(t => 
        t.id === id ? result : t
      ));
      // Refresh products to get updated quantities if status changed to completed
      if (status === 'completed') {
        const updatedProducts = await supabaseHook.fetchProducts();
        setProducts(updatedProducts);
      }
    }
  };

  const getStockTransfers = () => stockTransfers;

  // User functions
  const addUser = async (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) => {
    // After user is added via Supabase Auth in SettingsPage, just refresh users
    await refreshData();
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(user => 
      user.id === id ? { ...user, ...updates } : user
    ));
    toast({
      title: "User Updated",
      description: "User information has been updated."
    });
  };

  const deleteUser = async (userId: string) => {
    // Remove user from Supabase 'profiles' and Auth
    // 1. Get the profile by id
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('id', userId)
      .maybeSingle();
    if (error || !profile) {
      toast({ title: 'Error', description: error?.message || 'User not found', variant: 'destructive' });
      return;
    }
    // 2. Delete from profiles
    await supabase.from('profiles').delete().eq('id', userId);
    // 3. Delete from Auth (requires service role key, so just remove from UI for now)
    // 4. Refresh users
    await refreshData();
    toast({ title: 'User Deleted', description: 'User has been removed.' });
  };

  // Supplier functions
  const addSupplier = async (supplierData: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => {
    const result = await supabaseHook.addSupplier(supplierData);
    if (result) {
      setSuppliers(prev => [...prev, result]);
    }
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(supplier => 
      supplier.id === id ? { ...supplier, ...updates } : supplier
    ));
    toast({
      title: "Supplier Updated",
      description: "Supplier information has been updated."
    });
  };

  const deleteSupplier = (id: string) => {
    const supplier = suppliers.find(s => s.id === id);
    setSuppliers(prev => prev.filter(s => s.id !== id));
    toast({
      title: "Supplier Deleted",
      description: `${supplier?.name || 'Supplier'} has been removed.`
    });
  };

  const login = async (email: string, password: string) => {
    try {
      const data = await supabaseHook.loginWithSupabase(email, password);
      if (data && data.user) {
        // Fetch profile info from Supabase
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .maybeSingle();
        if (!profile) {
          // No profile found, do not set currentUser
          return false;
        }
        setCurrentUser({
          id: profile.id,
          username: profile.username,
          email: profile.email,
          role: (profile.role === 'admin' ? 'admin' : 'staff'),
          permissions: profile.permissions,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          user_id: profile.user_id,
          last_login: profile.last_login,
          must_set_password: profile.must_set_password,
        });
        return true;
      }
      return false;
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password.",
        variant: "destructive"
      });
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const value: WarehouseContextType = {
    // Data
    products,
    stockReceipts,
    stockTransfers,
    users,
    suppliers,
    currentUser,
    loading: supabaseHook.loading,
    
    // Products
    addProduct,
    updateProduct,
    deleteProduct,
    getProduct,
    getLowStockProducts,
    
    // Stock Receipts
    addStockReceipt,
    getStockReceipts,
    
    // Stock Transfers
    addStockTransfer,
    updateTransferStatus,
    getStockTransfers,
    
    // Users
    addUser,
    updateUser,
    deleteUser,
    
    // Suppliers
    addSupplier,
    updateSupplier,
    deleteSupplier,
    
    // Utilities
    refreshData,
    login,
    logout
  };

  return (
    <WarehouseContext.Provider value={value}>
      {children}
    </WarehouseContext.Provider>
  );
};