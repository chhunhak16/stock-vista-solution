import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';

// Type aliases for easier use
export type Product = Tables<'products'>;
export type Supplier = Tables<'suppliers'>;
export type StockReceipt = Tables<'stock_receipts'>;
export type StockTransfer = Tables<'stock_transfers'>;
export type Profile = Tables<'profiles'>;

export type ProductInsert = TablesInsert<'products'>;
export type SupplierInsert = TablesInsert<'suppliers'>;
export type StockReceiptInsert = TablesInsert<'stock_receipts'>;
export type StockTransferInsert = TablesInsert<'stock_transfers'>;

export const useSupabase = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (error: any, action: string) => {
    console.error(`Error ${action}:`, error);
    setError(error.message || `Failed to ${action}`);
    toast({
      title: "Error",
      description: error.message || `Failed to ${action}`,
      variant: "destructive"
    });
  };

  // Products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'fetch products');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async (product: ProductInsert) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Product Added",
        description: `${product.name} has been added to inventory.`
      });
      
      return data;
    } catch (error) {
      handleError(error, 'add product');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (id: string, updates: TablesUpdate<'products'>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Product Updated",
        description: "Product information has been updated."
      });
      
      return data;
    } catch (error) {
      handleError(error, 'update product');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Product Deleted",
        description: "Product has been removed from inventory."
      });
      
      return true;
    } catch (error) {
      handleError(error, 'delete product');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Suppliers
  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'fetch suppliers');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const addSupplier = async (supplier: SupplierInsert) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([supplier])
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Supplier Added",
        description: `${supplier.name} has been added to suppliers.`
      });
      
      return data;
    } catch (error) {
      handleError(error, 'add supplier');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Stock Receipts
  const fetchStockReceipts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stock_receipts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'fetch stock receipts');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const addStockReceipt = async (receipt: StockReceiptInsert) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stock_receipts')
        .insert([receipt])
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Stock Received",
        description: `${receipt.quantity} ${receipt.product_name} received.`
      });
      
      return data;
    } catch (error) {
      handleError(error, 'add stock receipt');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Stock Transfers
  const fetchStockTransfers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stock_transfers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'fetch stock transfers');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const addStockTransfer = async (transfer: StockTransferInsert) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stock_transfers')
        .insert([transfer])
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Transfer Created",
        description: `Transfer of ${transfer.quantity} ${transfer.product_name} created.`
      });
      
      return data;
    } catch (error) {
      handleError(error, 'add stock transfer');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateStockTransfer = async (id: string, updates: TablesUpdate<'stock_transfers'>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stock_transfers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Transfer Updated",
        description: "Transfer has been updated."
      });
      
      return data;
    } catch (error) {
      handleError(error, 'update transfer');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    // Products
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    // Suppliers
    fetchSuppliers,
    addSupplier,
    // Stock Receipts
    fetchStockReceipts,
    addStockReceipt,
    // Stock Transfers
    fetchStockTransfers,
    addStockTransfer,
    updateStockTransfer,
  };
};