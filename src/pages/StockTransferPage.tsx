import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { TruckIcon, Package, Plus, Calendar, CheckCircle, Clock, X } from 'lucide-react';
import { useWarehouse, StockTransfer } from '@/context/WarehouseContext';

const StockTransferPage: React.FC = () => {
  const { 
    products, 
    addStockTransfer, 
    getStockTransfers, 
    updateTransferStatus, 
    currentUser 
  } = useWarehouse();
  
  const [formData, setFormData] = useState({
    receiverName: '',
    productId: '',
    quantity: 0,
    date: new Date().toISOString().split('T')[0],
    status: 'pending' as StockTransfer['status'],
    notes: ''
  });

  const transfers = getStockTransfers();
  const selectedProduct = products.find(p => p.id === formData.productId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    addStockTransfer({
      receiver_name: formData.receiverName,
      product_id: formData.productId,
      product_name: selectedProduct.name,
      quantity: formData.quantity,
      date: formData.date,
      status: formData.status,
      notes: formData.notes,
      transferred_by: currentUser?.username || 'Unknown'
    });

    // Reset form
    setFormData({
      receiverName: '',
      productId: '',
      quantity: 0,
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      notes: ''
    });
  };

  const getStatusIcon = (status: StockTransfer['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'cancelled':
        return <X className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadgeClass = (status: StockTransfer['status']) => {
    switch (status) {
      case 'completed':
        return 'status-success';
      case 'pending':
        return 'status-warning';
      case 'cancelled':
        return 'status-danger';
      default:
        return 'status-warning';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Stock Transfer</h1>
        <p className="text-muted-foreground mt-1">
          Transfer stock to customers, other locations, or departments
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transfer Form */}
        <div className="form-section">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <TruckIcon className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">New Stock Transfer</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="receiver">Receiver Name / Destination</Label>
              <Input
                id="receiver"
                value={formData.receiverName}
                onChange={(e) => setFormData({...formData, receiverName: e.target.value})}
                placeholder="Customer name, location, or department"
                required
              />
            </div>

            <div>
              <Label htmlFor="product">Product</Label>
              <Select value={formData.productId} onValueChange={(value) => setFormData({...formData, productId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product to transfer" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} (Available: {product.quantity} {product.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProduct && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Available Stock</p>
                    <p className="font-semibold text-foreground">
                      {selectedProduct.quantity} {selectedProduct.unit}
                    </p>
                  </div>
                  {selectedProduct.quantity <= selectedProduct.stockAlert && (
                    <span className="status-badge status-warning text-xs">
                      Low Stock
                    </span>
                  )}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="quantity">Transfer Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={selectedProduct?.quantity || 0}
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                required
              />
              {selectedProduct && formData.quantity > selectedProduct.quantity && (
                <p className="text-sm text-destructive mt-1">
                  Quantity exceeds available stock ({selectedProduct.quantity})
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="date">Transfer Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: StockTransfer['status']) => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about this transfer..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-primary"
              disabled={
                !formData.receiverName || 
                !formData.productId || 
                formData.quantity <= 0 ||
                (selectedProduct && formData.quantity > selectedProduct.quantity)
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Transfer
            </Button>
          </form>
        </div>

        {/* Transfers List */}
        <div className="form-section">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-warning rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Recent Transfers</h2>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {transfers.length > 0 ? (
              transfers.slice().reverse().slice(0, 10).map((transfer) => (
                <div key={transfer.id} className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{transfer.productName}</h4>
                      <p className="text-sm text-muted-foreground">
                        To: {transfer.receiverName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {transfer.quantity}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`status-badge ${getStatusBadgeClass(transfer.status)} flex items-center`}>
                        {getStatusIcon(transfer.status)}
                        <span className="ml-1 capitalize">{transfer.status}</span>
                      </span>
                      {transfer.status === 'pending' && (
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateTransferStatus(transfer.id, 'completed')}
                            className="text-xs h-6 px-2"
                          >
                            Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateTransferStatus(transfer.id, 'cancelled')}
                            className="text-xs h-6 px-2 text-destructive"
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {transfer.date}
                    </span>
                    <span>By: {transfer.transferredBy}</span>
                  </div>
                  {transfer.notes && (
                    <p className="text-xs text-muted-foreground mt-2 p-2 bg-background rounded">
                      {transfer.notes}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <TruckIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No transfers yet</p>
                <p className="text-sm text-muted-foreground">
                  Create your first stock transfer
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="warehouse-card p-6 text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">Pending</h3>
          <p className="text-2xl font-bold text-warning">
            {transfers.filter(t => t.status === 'pending').length}
          </p>
        </div>
        <div className="warehouse-card p-6 text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">Completed</h3>
          <p className="text-2xl font-bold text-success">
            {transfers.filter(t => t.status === 'completed').length}
          </p>
        </div>
        <div className="warehouse-card p-6 text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">Today</h3>
          <p className="text-2xl font-bold text-primary">
            {transfers.filter(t => t.date === new Date().toISOString().split('T')[0]).length}
          </p>
        </div>
        <div className="warehouse-card p-6 text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">Total</h3>
          <p className="text-2xl font-bold text-accent">
            {transfers.length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StockTransferPage;