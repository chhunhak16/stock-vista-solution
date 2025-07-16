import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowDownToLine, Package, Plus, Calendar } from 'lucide-react';
import { useWarehouse } from '@/context/WarehouseContext';

const StockReceivePage: React.FC = () => {
  const { products, suppliers, addStockReceipt, getStockReceipts, currentUser } = useWarehouse();
  const [formData, setFormData] = useState({
    supplierName: '',
    productId: '',
    quantity: 0,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const recentReceipts = getStockReceipts().slice(-10);
  const selectedProduct = products.find(p => p.id === formData.productId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    addStockReceipt({
      supplier_name: formData.supplierName,
      product_id: formData.productId,
      product_name: selectedProduct.name,
      quantity: formData.quantity,
      date: formData.date,
      notes: formData.notes,
      received_by: currentUser?.username || 'Unknown'
    });

    // Reset form
    setFormData({
      supplierName: '',
      productId: '',
      quantity: 0,
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Stock Receive</h1>
        <p className="text-muted-foreground mt-1">
          Record incoming stock from suppliers and update inventory levels
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receipt Form */}
        <div className="form-section">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-success rounded-lg flex items-center justify-center">
              <ArrowDownToLine className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">New Stock Receipt</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Select value={formData.supplierName} onValueChange={(value) => setFormData({...formData, supplierName: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.name}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="product">Product</Label>
              <Select value={formData.productId} onValueChange={(value) => setFormData({...formData, productId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} (SKU: {product.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProduct && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Current Stock</p>
                <p className="font-semibold text-foreground">
                  {selectedProduct.quantity} {selectedProduct.unit}
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="quantity">Received Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                required
              />
            </div>

            <div>
              <Label htmlFor="date">Receipt Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about this receipt..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-success"
              disabled={!formData.supplierName || !formData.productId || formData.quantity <= 0}
            >
              <Plus className="mr-2 h-4 w-4" />
              Record Receipt
            </Button>
          </form>
        </div>

        {/* Recent Receipts */}
        <div className="form-section">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Recent Receipts</h2>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentReceipts.length > 0 ? (
              recentReceipts.reverse().map((receipt) => (
                <div key={receipt.id} className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-foreground">{receipt.productName}</h4>
                      <p className="text-sm text-muted-foreground">
                        From: {receipt.supplierName}
                      </p>
                    </div>
                    <span className="status-badge status-success">
                      +{receipt.quantity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {receipt.date}
                    </span>
                    <span>By: {receipt.receivedBy}</span>
                  </div>
                  {receipt.notes && (
                    <p className="text-xs text-muted-foreground mt-2 p-2 bg-background rounded">
                      {receipt.notes}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <ArrowDownToLine className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No stock receipts yet</p>
                <p className="text-sm text-muted-foreground">
                  Start by recording your first stock receipt
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="warehouse-card p-6 text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">Today's Receipts</h3>
          <p className="text-2xl font-bold text-success">
            {recentReceipts.filter(r => r.date === new Date().toISOString().split('T')[0]).length}
          </p>
        </div>
        <div className="warehouse-card p-6 text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">This Week</h3>
          <p className="text-2xl font-bold text-primary">
            {recentReceipts.filter(r => {
              const receiptDate = new Date(r.date);
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return receiptDate >= weekAgo;
            }).length}
          </p>
        </div>
        <div className="warehouse-card p-6 text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">Total Receipts</h3>
          <p className="text-2xl font-bold text-accent">
            {recentReceipts.length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StockReceivePage;