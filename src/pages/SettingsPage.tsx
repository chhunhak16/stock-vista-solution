import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Users, 
  Shield, 
  Building, 
  Plus, 
  Edit, 
  Trash2,
  Save,
  UserPlus
} from 'lucide-react';
import { useWarehouse, User, Supplier } from '@/context/WarehouseContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SettingsPage: React.FC = () => {
  const { 
    users, 
    suppliers, 
    addUser, 
    updateUser, 
    deleteUser,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    currentUser
  } = useWarehouse();

  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'staff' as User['role'],
    permissions: [] as string[]
  });

  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contact: '',
    email: '',
    phone: '',
    address: ''
  });

  const [systemSettings, setSystemSettings] = useState(() => {
    const saved = localStorage.getItem('warehouse_system_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback to default if corrupted
      }
    }
    return {
      warehouseName: 'Main Warehouse',
      location: 'Industrial District, City',
      autoBackup: true,
      emailNotifications: true
    };
  });

  const rolePermissions = {
    admin: ['all'],
    staff: ['stock_receive', 'stock_transfer'],
  };

  const { toast } = useToast();

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Invite user by email (use a random password, user will set their own after confirmation)
      const tempPassword = Math.random().toString(36).slice(-10) + 'Aa1!';
      const { data, error } = await supabase.auth.signUp({
        email: userForm.email,
        password: tempPassword
      });
      if (error) throw error;
      // Set role and username in profiles table if user was created
      if (data.user) {
        await supabase
          .from('profiles')
          .update({ role: userForm.role, username: userForm.username, must_set_password: true })
          .eq('user_id', data.user.id);
      }
      setIsUserDialogOpen(false);
      resetUserForm();
      alert('User invited successfully! They must check their email to complete registration and set their password.');
    } catch (err: any) {
      alert('Failed to invite user: ' + (err.message || err.error_description || 'Unknown error'));
    }
  };

  const handleSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier) {
      updateSupplier(editingSupplier.id, supplierForm);
      setEditingSupplier(null);
    } else {
      addSupplier(supplierForm);
      setIsSupplierDialogOpen(false);
    }
    resetSupplierForm();
  };

  const resetUserForm = () => {
    setUserForm({
      username: '',
      email: '',
      password: '',
      role: 'staff',
      permissions: []
    });
  };

  const resetSupplierForm = () => {
    setSupplierForm({
      name: '',
      contact: '',
      email: '',
      phone: '',
      address: ''
    });
  };

  const handleEditUser = (user: User) => {
    setUserForm({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      permissions: user.permissions || []
    });
    setEditingUser(user);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setSupplierForm({
      name: supplier.name,
      contact: supplier.contact_person,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address
    });
    setEditingSupplier(supplier);
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUser(userId);
    }
  };

  const handleDeleteSupplier = (supplierId: string) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      deleteSupplier(supplierId);
    }
  };

  const saveSystemSettings = () => {
    localStorage.setItem('warehouse_system_settings', JSON.stringify(systemSettings));
    toast({
      title: 'Settings Saved',
      description: 'Warehouse name and location have been updated.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage users, suppliers, and system configuration
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Users</span>
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="flex items-center space-x-2">
            <Building className="h-4 w-4" />
            <span>Suppliers</span>
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Permissions</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>System</span>
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card className="warehouse-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span>User Management</span>
                </CardTitle>
                {currentUser?.role === 'admin' && (
                  <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-primary">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add User
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleUserSubmit} className="space-y-4">
                        <div>
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            value={userForm.username}
                            onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={userForm.email}
                            onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={userForm.password}
                            onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="role">Role</Label>
                          <Select value={userForm.role} onValueChange={(value: User['role']) => setUserForm({...userForm, role: value})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Administrator</SelectItem>
                              <SelectItem value="staff">Staff</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" className="w-full">
                          Add User
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{user.username}</h4>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <span className={`status-badge ${
                          user.role === 'admin' ? 'status-success' :
                          'bg-primary/10 text-primary border border-primary/20'
                        } text-xs`}>
                          {user.role}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-6">
          <Card className="warehouse-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5 text-accent" />
                  <span>Supplier Management</span>
                </CardTitle>
                <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-warning">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Supplier
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Supplier</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSupplierSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="supplier-name">Company Name</Label>
                        <Input
                          id="supplier-name"
                          value={supplierForm.name}
                          onChange={(e) => setSupplierForm({...supplierForm, name: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact">Contact Person</Label>
                        <Input
                          id="contact"
                          value={supplierForm.contact}
                          onChange={(e) => setSupplierForm({...supplierForm, contact: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="supplier-email">Email</Label>
                        <Input
                          id="supplier-email"
                          type="email"
                          value={supplierForm.email}
                          onChange={(e) => setSupplierForm({...supplierForm, email: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={supplierForm.phone}
                          onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={supplierForm.address}
                          onChange={(e) => setSupplierForm({...supplierForm, address: e.target.value})}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        Add Supplier
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suppliers.map((supplier) => (
                  <div key={supplier.id} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                          <Building className="h-4 w-4 text-accent" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{supplier.name}</h4>
                          <p className="text-sm text-muted-foreground">{supplier.contact_person}</p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSupplier(supplier)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSupplier(supplier.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>{supplier.email}</p>
                      <p>{supplier.phone}</p>
                      <p>{supplier.address}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-6">
          <Card className="warehouse-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-success" />
                <span>Role Permissions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(rolePermissions).map(([role, permissions]) => (
                  <div key={role} className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold text-foreground capitalize mb-2">{role}</h4>
                    <div className="flex flex-wrap gap-2">
                      {permissions.map(permission => (
                        <span key={permission} className="status-badge bg-primary/10 text-primary border border-primary/20 text-xs">
                          {permission === 'all' ? 'All Permissions' : permission.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <Card className="warehouse-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-primary" />
                <span>System Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="warehouse-name">Warehouse Name</Label>
                    <Input
                      id="warehouse-name"
                      value={systemSettings.warehouseName}
                      onChange={(e) => setSystemSettings({...systemSettings, warehouseName: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={systemSettings.location}
                      onChange={(e) => setSystemSettings({...systemSettings, location: e.target.value})}
                    />
                  </div>
                </div>
                <div className="pt-4 border-t border-border">
                  <Button onClick={saveSystemSettings} className="bg-gradient-primary">
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUserSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={userForm.username}
                onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-role">Role</Label>
              <Select value={userForm.role} onValueChange={(value: User['role']) => setUserForm({...userForm, role: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2">
              <Button type="submit" className="flex-1">
                Update User
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setEditingUser(null)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Supplier Dialog */}
      <Dialog open={!!editingSupplier} onOpenChange={() => setEditingSupplier(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSupplierSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-supplier-name">Company Name</Label>
              <Input
                id="edit-supplier-name"
                value={supplierForm.name}
                onChange={(e) => setSupplierForm({...supplierForm, name: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-contact">Contact Person</Label>
              <Input
                id="edit-contact"
                value={supplierForm.contact}
                onChange={(e) => setSupplierForm({...supplierForm, contact: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-supplier-email">Email</Label>
              <Input
                id="edit-supplier-email"
                type="email"
                value={supplierForm.email}
                onChange={(e) => setSupplierForm({...supplierForm, email: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={supplierForm.address}
                onChange={(e) => setSupplierForm({...supplierForm, address: e.target.value})}
                required
              />
            </div>
            <div className="flex space-x-2">
              <Button type="submit" className="flex-1">
                Update Supplier
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setEditingSupplier(null)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;