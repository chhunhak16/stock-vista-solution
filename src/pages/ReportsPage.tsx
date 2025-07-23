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
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { format } from 'date-fns';

const ReportsPage: React.FC = () => {
  const { 
    products, 
    getStockReceipts, 
    getStockTransfers,
    suppliers 
  } = useWarehouse();
  
  // Date range state
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [reportCategory, setReportCategory] = useState('all');

  // Sort state
  const [dateSort, setDateSort] = useState<'asc' | 'desc'>('asc');

  // Add sort state for Stock Receive
  const [receiveSortField, setReceiveSortField] = useState<'category' | 'supplier_name'>('category');
  const [receiveSortDirection, setReceiveSortDirection] = useState<'asc' | 'desc'>('asc');

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

  // Get unique product categories
  const productCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  // Filter data based on date range and category
  const getFilteredData = () => {
    let filteredReceipts = stockReceipts;
    let filteredTransfers = stockTransfers;
    let filteredProducts = products;
    if (dateRange.from && dateRange.to) {
      filteredReceipts = filteredReceipts.filter(receipt => {
        const d = new Date(receipt.date);
        return d >= dateRange.from! && d <= dateRange.to!;
      });
      filteredTransfers = filteredTransfers.filter(transfer => {
        const d = new Date(transfer.date);
        return d >= dateRange.from! && d <= dateRange.to!;
      });
    }
    if (reportCategory !== 'all') {
      filteredProducts = products.filter(p => p.category === reportCategory);
      filteredReceipts = filteredReceipts.filter(r => r.product_name && products.find(p => p.name === r.product_name && p.category === reportCategory));
      filteredTransfers = filteredTransfers.filter(t => t.product_name && products.find(p => p.name === t.product_name && p.category === reportCategory));
    }
    // Sort by Date only
    filteredReceipts = filteredReceipts.slice().sort((a, b) => {
      const aValue = new Date(a.date).getTime();
      const bValue = new Date(b.date).getTime();
      if (aValue < bValue) return dateSort === 'asc' ? -1 : 1;
      if (aValue > bValue) return dateSort === 'asc' ? 1 : -1;
      return 0;
    });
    filteredTransfers = filteredTransfers.slice().sort((a, b) => {
      const aValue = new Date(a.date).getTime();
      const bValue = new Date(b.date).getTime();
      if (aValue < bValue) return dateSort === 'asc' ? -1 : 1;
      if (aValue > bValue) return dateSort === 'asc' ? 1 : -1;
      return 0;
    });
    return { filteredReceipts, filteredTransfers, filteredProducts };
  };

  const { filteredReceipts, filteredTransfers, filteredProducts } = getFilteredData();

  // Calculate metrics
  const totalReceived = filteredReceipts.reduce((sum, receipt) => sum + receipt.quantity, 0);
  const totalTransferred = filteredTransfers
    .filter(t => t.status === 'completed')
    .reduce((sum, transfer) => sum + transfer.quantity, 0);
  
  const lowStockCount = filteredProducts.filter(p => p.quantity <= p.stock_alert).length;
  const activeSuppliers = new Set(filteredReceipts.map(r => r.supplier_name)).size;

  // Generate export data
  const generateReport = () => {
    const reportData = {
      period: dateRange.from ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to?.toLocaleDateString()}` : 'custom',
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
      lowStockProducts: products.filter(p => p.quantity <= p.stock_alert)
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `warehouse-report-${dateRange.from ? `${dateRange.from.toLocaleDateString()}-${dateRange.to?.toLocaleDateString()}` : 'custom'}-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export as Excel
  const exportExcel = () => {
    // Prepare data for each sheet
    const summarySheet = [
      {
        'Total Products': filteredProducts.length,
        'Total Received': totalReceived,
        'Total Transferred': totalTransferred,
        'Low Stock Items': lowStockCount,
        'Active Suppliers': activeSuppliers,
        'Period': dateRange.from ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to?.toLocaleDateString()}` : 'custom',
        'Generated Date': new Date().toLocaleString()
      }
    ];
    const receiptsSheet = filteredReceipts.map(r => ({
      Date: r.date,
      Product: r.product_name,
      Quantity: r.quantity,
      Supplier: r.supplier_name,
      Notes: r.notes || '',
    }));
    const transfersSheet = filteredTransfers.map(t => ({
      Date: t.date,
      Product: t.product_name,
      Quantity: t.quantity,
      Status: t.status,
      Notes: t.notes || '',
    }));
    const lowStockSheet = filteredProducts.filter(p => p.quantity <= p.stock_alert).map(p => ({
      Name: p.name,
      SKU: p.sku,
      Quantity: p.quantity,
      Alert: p.stock_alert,
      Unit: p.unit
    }));

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summarySheet), 'Summary');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(receiptsSheet), 'Receipts');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(transfersSheet), 'Transfers');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(lowStockSheet), 'Low Stock');

    // Export to file
    XLSX.writeFile(wb, `warehouse-report-${dateRange.from ? `${dateRange.from.toLocaleDateString()}-${dateRange.to?.toLocaleDateString()}` : 'custom'}-${today}.xlsx`);
  };

  // Remove JSON export, add PDF export
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Warehouse Report', 10, 15);
    doc.setFontSize(10);
    doc.text(`Period: ${dateRange.from ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to?.toLocaleDateString()}` : 'custom'}`, 10, 25);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 10, 32);
    doc.text('Summary:', 10, 42);
    doc.text(`Total Products: ${filteredProducts.length}`, 10, 50);
    doc.text(`Total Received: ${totalReceived}`, 10, 56);
    doc.text(`Total Transferred: ${totalTransferred}`, 10, 62);
    doc.text(`Low Stock Items: ${lowStockCount}`, 10, 68);
    doc.text(`Active Suppliers: ${activeSuppliers}`, 10, 74);
    doc.save(`warehouse-report-${dateRange.from ? `${dateRange.from.toLocaleDateString()}-${dateRange.to?.toLocaleDateString()}` : 'custom'}-${today}.pdf`);
  };

  // Sort Stock Receipts by selected field and direction
  const sortReceipts = (a, b) => {
    let aValue, bValue;
    if (receiveSortField === 'category') {
      aValue = (products.find(p => p.name === a.product_name)?.category || '').toLowerCase();
      bValue = (products.find(p => p.name === b.product_name)?.category || '').toLowerCase();
    } else if (receiveSortField === 'supplier_name') {
      aValue = (a.supplier_name || '').toLowerCase();
      bValue = (b.supplier_name || '').toLowerCase();
    }
    if (aValue < bValue) return receiveSortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return receiveSortDirection === 'asc' ? 1 : -1;
    return 0;
  };
  const sortedReceipts = filteredReceipts.slice().sort(sortReceipts);

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
        <div className="flex gap-2">
          <Button onClick={exportPDF} className="bg-gradient-primary">
            <Download className="mr-2 h-4 w-4" />
            Export as PDF
          </Button>
          <Button onClick={exportExcel} className="bg-gradient-success">
            <Download className="mr-2 h-4 w-4" />
            Export as Excel
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="warehouse-card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm">From:</label>
            <input
              type="date"
              className="border rounded px-2 py-1"
              value={dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : ''}
              onChange={e => {
                const newFrom = e.target.value ? new Date(e.target.value) : undefined;
                setDateRange(r => ({ ...r, from: newFrom }));
              }}
            />
            <label className="text-sm">To:</label>
            <input
              type="date"
              className="border rounded px-2 py-1"
              value={dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : ''}
              onChange={e => {
                const newTo = e.target.value ? new Date(e.target.value) : undefined;
                setDateRange(r => ({ ...r, to: newTo }));
              }}
            />
          </div>
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <Select value={reportCategory} onValueChange={setReportCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {productCategories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
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
              Items received in {dateRange.from ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to?.toLocaleDateString()}` : 'custom'} period
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
              Items transferred in {dateRange.from ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to?.toLocaleDateString()}` : 'custom'} period
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
              <span>Stock Movements ({dateRange.from ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to?.toLocaleDateString()}` : 'custom'})</span>
            </CardTitle>
            {/* Sort controls for Stock Receive */}
            <div className="flex items-center space-x-2 mt-2">
              <label className="text-sm">Sort Stock Receive by:</label>
              <Select value={receiveSortField} onValueChange={v => setReceiveSortField(v as any)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="category">Product Category</SelectItem>
                  <SelectItem value="supplier_name">Supplier Name</SelectItem>
                </SelectContent>
              </Select>
              <Select value={receiveSortDirection} onValueChange={v => setReceiveSortDirection(v as any)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-success/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <ArrowDownToLine className="h-5 w-5 text-success" />
                  <div>
                    <p className="font-medium text-foreground">Stock Receipts</p>
                    <p className="text-sm text-muted-foreground">{sortedReceipts.length} transactions</p>
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
                    acc[receipt.product_name] = (acc[receipt.product_name] || 0) + receipt.quantity;
                    return acc;
                  }, {} as Record<string, number>)
                  ? Object.entries(
                      filteredReceipts.reduce((acc, receipt) => {
                        acc[receipt.product_name] = (acc[receipt.product_name] || 0) + receipt.quantity;
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
                    acc[transfer.product_name] = (acc[transfer.product_name] || 0) + transfer.quantity;
                    return acc;
                  }, {} as Record<string, number>)
                  ? Object.entries(
                      filteredTransfers
                        .filter(t => t.status === 'completed')
                        .reduce((acc, transfer) => {
                          acc[transfer.product_name] = (acc[transfer.product_name] || 0) + transfer.quantity;
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
              {filteredProducts
                .filter(p => p.quantity <= p.stock_alert)
                .map(product => (
                  <div key={product.id} className="p-3 bg-warning/5 border border-warning/20 rounded-lg">
                    <h4 className="font-medium text-foreground">{product.name}</h4>
                    <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-foreground">
                        Current: {product.quantity} {product.unit}
                      </span>
                      <span className="text-sm text-warning">
                        Alert: {product.stock_alert}
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