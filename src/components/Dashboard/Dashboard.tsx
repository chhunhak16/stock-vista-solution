import React from 'react';
import { MetricCard } from './MetricCard';
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  ArrowDownToLine, 
  TruckIcon,
  Activity,
  DollarSign
} from 'lucide-react';
import { useWarehouse } from '@/context/WarehouseContext';
import { Button } from '@/components/ui/button';

export const Dashboard: React.FC = () => {
  const { 
    products, 
    getLowStockProducts, 
    getStockReceipts, 
    getStockTransfers,
    suppliers 
  } = useWarehouse();

  const lowStockProducts = getLowStockProducts();
  const recentReceipts = getStockReceipts().slice(-5);
  const recentTransfers = getStockTransfers().slice(-5);
  const totalValue = products.reduce((sum, product) => sum + (product.quantity * 10), 0); // Simplified value calculation

  const todayTransfers = getStockTransfers().filter(
    t => t.date === new Date().toISOString().split('T')[0]
  ).length;

  const todayReceipts = getStockReceipts().filter(
    r => r.date === new Date().toISOString().split('T')[0]
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's what's happening in your warehouse today.
        </p>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="stock-alert rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <div>
                <h3 className="font-semibold text-foreground">Low Stock Alert</h3>
                <p className="text-sm text-muted-foreground">
                  {lowStockProducts.length} product{lowStockProducts.length !== 1 ? 's' : ''} running low on stock
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Products"
          value={products.length}
          change="+2 this week"
          changeType="positive"
          icon={Package}
        />
        <MetricCard
          title="Low Stock Items"
          value={lowStockProducts.length}
          change={lowStockProducts.length > 0 ? "Requires attention" : "All good"}
          changeType={lowStockProducts.length > 0 ? "negative" : "positive"}
          icon={AlertTriangle}
        />
        <MetricCard
          title="Today's Receipts"
          value={todayReceipts}
          change="Stock received"
          changeType="neutral"
          icon={ArrowDownToLine}
        />
        <MetricCard
          title="Today's Transfers"
          value={todayTransfers}
          change="Items transferred"
          changeType="neutral"
          icon={TruckIcon}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Stock Receipts */}
        <div className="warehouse-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Recent Stock Receipts</h3>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {recentReceipts.length > 0 ? (
              recentReceipts.map((receipt) => (
                <div key={receipt.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
                      <ArrowDownToLine className="h-4 w-4 text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{receipt.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {receipt.quantity} units from {receipt.supplier_name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{receipt.date}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent stock receipts
              </p>
            )}
          </div>
        </div>

        {/* Recent Stock Transfers */}
        <div className="warehouse-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Recent Stock Transfers</h3>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {recentTransfers.length > 0 ? (
              recentTransfers.map((transfer) => (
                <div key={transfer.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <TruckIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{transfer.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {transfer.quantity} units to {transfer.receiver_name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`status-badge ${
                      transfer.status === 'completed' ? 'status-success' :
                      transfer.status === 'pending' ? 'status-warning' :
                      'status-danger'
                    }`}>
                      {transfer.status}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">{transfer.date}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent stock transfers
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="warehouse-card p-6 text-center">
          <div className="w-12 h-12 bg-gradient-success rounded-lg flex items-center justify-center mx-auto mb-3">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Active Suppliers</h3>
          <p className="text-2xl font-bold text-success mt-1">{suppliers.length}</p>
          <p className="text-sm text-muted-foreground mt-2">Registered suppliers</p>
        </div>

        <div className="warehouse-card p-6 text-center">
          <div className="w-12 h-12 bg-gradient-warning rounded-lg flex items-center justify-center mx-auto mb-3">
            <Package className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Total Stock Units</h3>
          <p className="text-2xl font-bold text-warning mt-1">
            {products.reduce((sum, p) => sum + p.quantity, 0)}
          </p>
          <p className="text-sm text-muted-foreground mt-2">Items in warehouse</p>
        </div>

        <div className="warehouse-card p-6 text-center">
          <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-3">
            <DollarSign className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Estimated Value</h3>
          <p className="text-2xl font-bold text-primary mt-1">
            ${totalValue.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground mt-2">Total inventory value</p>
        </div>
      </div>
    </div>
  );
};