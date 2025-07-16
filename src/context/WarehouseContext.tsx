import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

// Types
export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  stockAlert: number;
  unit: string;
  supplier: string;
  createdDate: string;
  updatedDate: string;
}

export interface StockReceipt {
  id: string;
  supplierName: string;
  productId: string;
  productName: string;
  quantity: number;
  date: string;
  notes: string;
  receivedBy: string;
}

export interface StockTransfer {
  id: string;
  receiverName: string;
  productId: string;
  productName: string;
  quantity: number;
  date: string;
  status: 'pending' | 'completed' | 'cancelled';
  notes: string;
  transferredBy: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'staff' | 'viewer';
  permissions: string[];
  createdDate: string;
  lastLogin: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
}

interface WarehouseContextType {
  // Data
  products: Product[];
  stockReceipts: StockReceipt[];
  stockTransfers: StockTransfer[];
  users: User[];
  suppliers: Supplier[];
  currentUser: User | null;
  
  // Products
  addProduct: (product: Omit<Product, 'id' | 'createdDate' | 'updatedDate'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProduct: (id: string) => Product | undefined;
  getLowStockProducts: () => Product[];
  
  // Stock Receipts
  addStockReceipt: (receipt: Omit<StockReceipt, 'id'>) => void;
  getStockReceipts: () => StockReceipt[];
  
  // Stock Transfers
  addStockTransfer: (transfer: Omit<StockTransfer, 'id'>) => void;
  updateTransferStatus: (id: string, status: StockTransfer['status']) => void;
  getStockTransfers: () => StockTransfer[];
  
  // Users
  addUser: (user: Omit<User, 'id' | 'createdDate' | 'lastLogin'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  
  // Suppliers
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  
  // Utilities
  generateId: () => string;
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

export const useWarehouse = () => {
  const context = useContext(WarehouseContext);
  if (!context) {
    throw new Error('useWarehouse must be used within a WarehouseProvider');
  }
  return context;
};

// Sample data
const sampleProducts: Product[] = [
  {
    id: '1',
    name: 'Industrial Bearings',
    sku: 'IB-001',
    category: 'Machinery Parts',
    quantity: 150,
    stockAlert: 50,
    unit: 'pieces',
    supplier: 'TechParts Ltd',
    createdDate: '2024-01-15',
    updatedDate: '2024-07-16'
  },
  {
    id: '2',
    name: 'Steel Pipes (2m)',
    sku: 'SP-002',
    category: 'Construction',
    quantity: 25,
    stockAlert: 30,
    unit: 'pieces',
    supplier: 'Steel Works Inc',
    createdDate: '2024-02-10',
    updatedDate: '2024-07-16'
  },
  {
    id: '3',
    name: 'Safety Helmets',
    sku: 'SH-003',
    category: 'Safety Equipment',
    quantity: 75,
    stockAlert: 20,
    unit: 'pieces',
    supplier: 'Safety First Corp',
    createdDate: '2024-03-05',
    updatedDate: '2024-07-16'
  },
  {
    id: '4',
    name: 'Hydraulic Oil (5L)',
    sku: 'HO-004',
    category: 'Fluids',
    quantity: 12,
    stockAlert: 15,
    unit: 'bottles',
    supplier: 'Industrial Fluids Co',
    createdDate: '2024-04-12',
    updatedDate: '2024-07-16'
  }
];

const sampleSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'TechParts Ltd',
    contact: 'John Smith',
    email: 'orders@techparts.com',
    phone: '+1-555-0123',
    address: '123 Industrial Blvd, Tech City'
  },
  {
    id: '2',
    name: 'Steel Works Inc',
    contact: 'Maria Garcia',
    email: 'sales@steelworks.com',
    phone: '+1-555-0456',
    address: '456 Steel Avenue, Metal Town'
  },
  {
    id: '3',
    name: 'Safety First Corp',
    contact: 'David Wilson',
    email: 'info@safetyfirst.com',
    phone: '+1-555-0789',
    address: '789 Safety Street, Guard City'
  },
  {
    id: '4',
    name: 'Industrial Fluids Co',
    contact: 'Sarah Brown',
    email: 'orders@industrialfluids.com',
    phone: '+1-555-0321',
    address: '321 Fluid Lane, Liquid Valley'
  }
];

const sampleUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@warehouse.com',
    role: 'admin',
    permissions: ['all'],
    createdDate: '2024-01-01',
    lastLogin: '2024-07-16'
  },
  {
    id: '2',
    username: 'manager1',
    email: 'manager@warehouse.com',
    role: 'manager',
    permissions: ['inventory', 'reports', 'users'],
    createdDate: '2024-01-15',
    lastLogin: '2024-07-15'
  },
  {
    id: '3',
    username: 'staff1',
    email: 'staff@warehouse.com',
    role: 'staff',
    permissions: ['inventory', 'stock_receive', 'stock_transfer'],
    createdDate: '2024-02-01',
    lastLogin: '2024-07-16'
  }
];

export const WarehouseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [stockReceipts, setStockReceipts] = useState<StockReceipt[]>([]);
  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedProducts = localStorage.getItem('warehouse_products');
    const savedReceipts = localStorage.getItem('warehouse_receipts');
    const savedTransfers = localStorage.getItem('warehouse_transfers');
    const savedUsers = localStorage.getItem('warehouse_users');
    const savedSuppliers = localStorage.getItem('warehouse_suppliers');

    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    } else {
      setProducts(sampleProducts);
    }

    if (savedReceipts) {
      setStockReceipts(JSON.parse(savedReceipts));
    }

    if (savedTransfers) {
      setStockTransfers(JSON.parse(savedTransfers));
    }

    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      setUsers(sampleUsers);
    }

    if (savedSuppliers) {
      setSuppliers(JSON.parse(savedSuppliers));
    } else {
      setSuppliers(sampleSuppliers);
    }

    // Set current user (demo purposes)
    setCurrentUser(sampleUsers[0]);
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('warehouse_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('warehouse_receipts', JSON.stringify(stockReceipts));
  }, [stockReceipts]);

  useEffect(() => {
    localStorage.setItem('warehouse_transfers', JSON.stringify(stockTransfers));
  }, [stockTransfers]);

  useEffect(() => {
    localStorage.setItem('warehouse_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('warehouse_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  const generateId = () => Date.now().toString();

  // Product functions
  const addProduct = (productData: Omit<Product, 'id' | 'createdDate' | 'updatedDate'>) => {
    const newProduct: Product = {
      ...productData,
      id: generateId(),
      createdDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0]
    };
    setProducts(prev => [...prev, newProduct]);
    toast({
      title: "Product Added",
      description: `${newProduct.name} has been added to inventory.`
    });
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(product => 
      product.id === id 
        ? { ...product, ...updates, updatedDate: new Date().toISOString().split('T')[0] }
        : product
    ));
    toast({
      title: "Product Updated",
      description: "Product information has been updated."
    });
  };

  const deleteProduct = (id: string) => {
    const product = products.find(p => p.id === id);
    setProducts(prev => prev.filter(p => p.id !== id));
    toast({
      title: "Product Deleted",
      description: `${product?.name || 'Product'} has been removed from inventory.`
    });
  };

  const getProduct = (id: string) => products.find(p => p.id === id);

  const getLowStockProducts = () => products.filter(p => p.quantity <= p.stockAlert);

  // Stock Receipt functions
  const addStockReceipt = (receiptData: Omit<StockReceipt, 'id'>) => {
    const newReceipt: StockReceipt = {
      ...receiptData,
      id: generateId()
    };
    setStockReceipts(prev => [...prev, newReceipt]);
    
    // Update product quantity
    updateProduct(receiptData.productId, {
      quantity: (getProduct(receiptData.productId)?.quantity || 0) + receiptData.quantity
    });
    
    toast({
      title: "Stock Received",
      description: `${receiptData.quantity} ${receiptData.productName} received from ${receiptData.supplierName}.`
    });
  };

  const getStockReceipts = () => stockReceipts;

  // Stock Transfer functions
  const addStockTransfer = (transferData: Omit<StockTransfer, 'id'>) => {
    const product = getProduct(transferData.productId);
    if (!product || product.quantity < transferData.quantity) {
      toast({
        title: "Transfer Failed",
        description: "Insufficient stock for this transfer.",
        variant: "destructive"
      });
      return;
    }

    const newTransfer: StockTransfer = {
      ...transferData,
      id: generateId()
    };
    setStockTransfers(prev => [...prev, newTransfer]);
    
    // Update product quantity if transfer is completed
    if (transferData.status === 'completed') {
      updateProduct(transferData.productId, {
        quantity: product.quantity - transferData.quantity
      });
    }
    
    toast({
      title: "Transfer Created",
      description: `Transfer of ${transferData.quantity} ${transferData.productName} to ${transferData.receiverName} created.`
    });
  };

  const updateTransferStatus = (id: string, status: StockTransfer['status']) => {
    const transfer = stockTransfers.find(t => t.id === id);
    if (!transfer) return;

    if (status === 'completed' && transfer.status !== 'completed') {
      const product = getProduct(transfer.productId);
      if (product) {
        updateProduct(transfer.productId, {
          quantity: product.quantity - transfer.quantity
        });
      }
    }

    setStockTransfers(prev => prev.map(t => 
      t.id === id ? { ...t, status } : t
    ));
    
    toast({
      title: "Transfer Updated",
      description: `Transfer status updated to ${status}.`
    });
  };

  const getStockTransfers = () => stockTransfers;

  // User functions
  const addUser = (userData: Omit<User, 'id' | 'createdDate' | 'lastLogin'>) => {
    const newUser: User = {
      ...userData,
      id: generateId(),
      createdDate: new Date().toISOString().split('T')[0],
      lastLogin: 'Never'
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
  const addSupplier = (supplierData: Omit<Supplier, 'id'>) => {
    const newSupplier: Supplier = {
      ...supplierData,
      id: generateId()
    };
    setSuppliers(prev => [...prev, newSupplier]);
    toast({
      title: "Supplier Added",
      description: `${newSupplier.name} has been added to suppliers.`
    });
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
    generateId
  };

  return (
    <WarehouseContext.Provider value={value}>
      {children}
    </WarehouseContext.Provider>
  );
};