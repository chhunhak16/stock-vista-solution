import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  Package, 
  ArrowDownToLine, 
  TruckIcon,
  Calendar,
  FileText
} from 'lucide-react';
import { useWarehouse } from '@/context/WarehouseContext';

const ReportsPage: React.FC = () => {
  const { 
    products, 
    getStockReceipts, 
    getStockTransfers,
    suppliers 
  } = useWarehouse();
  
  const [reportType, setReportType] = useState('daily');
  const [reportCategory, setReportCategory] = useState('all');

  const stockReceipts = getStockReceipts();
  const stockTransfers = getStockTransfers();

  // Calculate date ranges
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  
  const yearAgo = new Date();
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);

  // Filter data based on report type
  const getFilteredData = () => {
    const now = new Date();
    let startDate: Date;

    switch (reportType) {
      case 'daily':
        startDate = new Date(today);
        break;
      case 'weekly':
        startDate = weekAgo;
        break;
      case 'monthly':
        startDate = monthAgo;
        break;
      case 'yearly':
        startDate = yearAgo;
        break;
      default:
        startDate = new Date(today);
    }

    const filteredReceipts = stockReceipts.filter(receipt => 
      new Date(receipt.date) >= startDate
    );
    
    const filteredTransfers = stockTransfers.filter(transfer => 
      new Date(transfer.date) >= startDate
    );

    return { filteredReceipts, filteredTransfers };
  };

  const { filteredReceipts, filteredTransfers } = getFilteredData();

  // Calculate metrics
  const totalReceived = filteredReceipts.reduce((sum, receipt) => sum + receipt.quantity, 0);
  const totalTransferred = filteredTransfers
    .filter(t => t.status === 'completed')
    .reduce((sum, transfer) => sum + transfer.quantity, 0);
  
  const lowStockCount = products.filter(p => p.quantity <= p.stockAlert).length;
  const activeSuppliers = new Set(filteredReceipts.map(r => r.supplierName)).size;

  // Generate export data
  const generateReport = () => {
    const reportData = {
      period: reportType,
      generatedDate: new Date().toISOString(),
      summary: {
        totalProducts: products.length,
        totalReceived,
        totalTransferred,
        lowStockItems: lowStockCount,
        activeSuppliers
      },
      receipts: filteredReceipts,
      transfers: filteredTransfers,
      lowStockProducts: products.filter(p => p.quantity <= p.stockAlert)
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `warehouse-report-${reportType}-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive insights into your warehouse operations
          </p>
        </div>
        <Button onClick={generateReport} className="bg-gradient-primary">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Controls */}
      <div className="warehouse-card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily Report</SelectItem>
                <SelectItem value="weekly">Weekly Report</SelectItem>
                <SelectItem value="monthly">Monthly Report</SelectItem>
                <SelectItem value="yearly">Yearly Report</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <Select value={reportCategory} onValueChange={setReportCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="inventory">Inventory Only</SelectItem>
                <SelectItem value="movements">Stock Movements</SelectItem>
                <SelectItem value="suppliers">Supplier Performance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="warehouse-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Stock Received
            </CardTitle>
            <ArrowDownToLine className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{totalReceived}</div>
            <p className="text-xs text-muted-foreground">
              Items received in {reportType} period
            </p>
          </CardContent>
        </Card>

        <Card className="warehouse-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Stock Transferred
            </CardTitle>
            <TruckIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalTransferred}</div>
            <p className="text-xs text-muted-foreground">
              Items transferred in {reportType} period
            </p>
          </CardContent>
        </Card>

        <Card className="warehouse-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Stock Alerts
            </CardTitle>
            <Package className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground">
              Products requiring attention
            </p>
          </CardContent>
        </Card>

        <Card className="warehouse-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Suppliers
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{activeSuppliers}</div>
            <p className="text-xs text-muted-foreground">
              Suppliers with activity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Movements */}
        <Card className="warehouse-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span>Stock Movements ({reportType})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-success/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <ArrowDownToLine className="h-5 w-5 text-success" />
                  <div>
                    <p className="font-medium text-foreground">Stock Receipts</p>
                    <p className="text-sm text-muted-foreground">{filteredReceipts.length} transactions</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-success">+{totalReceived}</p>
                  <p className="text-xs text-muted-foreground">units</p>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <TruckIcon className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Stock Transfers</p>
                    <p className="text-sm text-muted-foreground">{filteredTransfers.length} transactions</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">-{totalTransferred}</p>
                  <p className="text-xs text-muted-foreground">units</p>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-foreground">Net Change</span>
                  <span className={`text-lg font-bold ${
                    totalReceived - totalTransferred >= 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    {totalReceived - totalTransferred >= 0 ? '+' : ''}{totalReceived - totalTransferred}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="warehouse-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-accent" />
              <span>Product Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Most Received Products */}
              <div>
                <h4 className="font-medium text-foreground mb-2">Most Received</h4>
                {filteredReceipts
                  .reduce((acc, receipt) => {
                    acc[receipt.productName] = (acc[receipt.productName] || 0) + receipt.quantity;
                    return acc;
                  }, {} as Record<string, number>)
                  ? Object.entries(
                      filteredReceipts.reduce((acc, receipt) => {
                        acc[receipt.productName] = (acc[receipt.productName] || 0) + receipt.quantity;
                        return acc;
                      }, {} as Record<string, number>)
                    )
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 3)
                    .map(([product, quantity]) => (
                      <div key={product} className="flex justify-between items-center text-sm">
                        <span className="text-foreground">{product}</span>
                        <span className="text-success font-medium">+{quantity}</span>
                      </div>
                    ))
                  : <p className="text-sm text-muted-foreground">No data available</p>
                }
              </div>

              <div className="border-t border-border pt-3">
                <h4 className="font-medium text-foreground mb-2">Most Transferred</h4>
                {filteredTransfers
                  .filter(t => t.status === 'completed')
                  .reduce((acc, transfer) => {
                    acc[transfer.productName] = (acc[transfer.productName] || 0) + transfer.quantity;
                    return acc;
                  }, {} as Record<string, number>)
                  ? Object.entries(
                      filteredTransfers
                        .filter(t => t.status === 'completed')
                        .reduce((acc, transfer) => {
                          acc[transfer.productName] = (acc[transfer.productName] || 0) + transfer.quantity;
                          return acc;
                        }, {} as Record<string, number>)
                    )
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 3)
                    .map(([product, quantity]) => (
                      <div key={product} className="flex justify-between items-center text-sm">
                        <span className="text-foreground">{product}</span>
                        <span className="text-primary font-medium">-{quantity}</span>
                      </div>
                    ))
                  : <p className="text-sm text-muted-foreground">No data available</p>
                }
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Report */}
      {lowStockCount > 0 && (
        <Card className="warehouse-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-warning">
              <Package className="h-5 w-5" />
              <span>Low Stock Alert Report</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products
                .filter(p => p.quantity <= p.stockAlert)
                .map(product => (
                  <div key={product.id} className="p-3 bg-warning/5 border border-warning/20 rounded-lg">
                    <h4 className="font-medium text-foreground">{product.name}</h4>
                    <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-foreground">
                        Current: {product.quantity} {product.unit}
                      </span>
                      <span className="text-sm text-warning">
                        Alert: {product.stockAlert}
                      </span>
                    </div>
                  </div>
                ))
              }
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReportsPage;