import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  TruckIcon, 
  ArrowDownToLine, 
  BarChart3, 
  Settings, 
  Warehouse,
  Users,
  Boxes
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWarehouse } from '@/context/WarehouseContext';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: string;
}

const navigation: SidebarItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Stock Receive', href: '/stock-receive', icon: ArrowDownToLine },
  { name: 'Stock Transfer', href: '/stock-transfer', icon: TruckIcon },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { currentUser } = useWarehouse();

  // Define navigation based on role
  let filteredNavigation = [];
  if (currentUser?.role === 'admin') {
    filteredNavigation = navigation;
  } else if (currentUser?.role === 'staff') {
    filteredNavigation = navigation.filter(item =>
      item.name === 'Stock Receive' || item.name === 'Stock Transfer'
    );
  }

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r border-border">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="warehouse-gradient w-8 h-8 rounded-lg flex items-center justify-center">
            <Warehouse className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">WarehouseMS</h1>
            <p className="text-xs text-muted-foreground">Management System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {filteredNavigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                'sidebar-nav-item',
                isActive ? 'sidebar-nav-active' : 'sidebar-nav-inactive'
              )}
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
              <span className="truncate">{item.name}</span>
              {item.badge && (
                <span className="ml-auto rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <Users className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">Admin User</p>
            <p className="text-xs text-muted-foreground truncate">admin@warehouse.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};