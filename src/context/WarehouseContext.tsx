import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { useSupabase, Product as SupabaseProduct, Supplier as SupabaseSupplier, StockReceipt as SupabaseStockReceipt, StockTransfer as SupabaseStockTransfer } from '@/hooks/useSupabase';

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
  role: 'admin' | 'manager' | 'staff' | 'viewer';
  permissions?: string[];
  created_at: string;
  user_id: string;
  last_login?: string;
  updated_at: string;
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

  // Load data from Supabase on mount
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    const [productsData, suppliersData, receiptsData, transfersData] = await Promise.all([
      supabaseHook.fetchProducts(),
      supabaseHook.fetchSuppliers(),
      supabaseHook.fetchStockReceipts(),
      supabaseHook.fetchStockTransfers()
    ]);

    setProducts(productsData);
    setSuppliers(suppliersData);
    setStockReceipts(receiptsData);
    setStockTransfers(transfersData);
    
    // Set demo user for now
    setCurrentUser({
      id: '1',
      username: 'admin',
      email: 'admin@warehouse.com',
      role: 'admin',
      permissions: ['all'],
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      user_id: '1',
      last_login: '2024-07-16'
    });
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

  // User functions (keeping simple for now, can add Supabase later)
  const addUser = (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) => {
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setUsers(prev => [...prev, newUser]);
    toast({
      title: "User Added",
      description: `User ${newUser.username} has been created.`
    });
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

  const deleteUser = (id: string) => {
    const user = users.find(u => u.id === id);
    setUsers(prev => prev.filter(u => u.id !== id));
    toast({
      title: "User Deleted",
      description: `User ${user?.username || 'User'} has been removed.`
    });
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
    refreshData
  };

  return (
    <WarehouseContext.Provider value={value}>
      {children}
    </WarehouseContext.Provider>
  );
};