-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('admin', 'manager', 'staff', 'viewer');

-- Create enum for transfer status
CREATE TYPE public.transfer_status AS ENUM ('pending', 'in_transit', 'completed', 'cancelled');

-- Create suppliers table
CREATE TABLE public.suppliers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    category TEXT,
    quantity INTEGER NOT NULL DEFAULT 0,
    stock_alert INTEGER NOT NULL DEFAULT 10,
    unit TEXT NOT NULL DEFAULT 'pcs',
    supplier_id UUID REFERENCES public.suppliers(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table for user management
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'viewer',
    permissions TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Create stock_receipts table
CREATE TABLE public.stock_receipts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_id UUID REFERENCES public.suppliers(id),
    supplier_name TEXT NOT NULL,
    product_id UUID NOT NULL REFERENCES public.products(id),
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    received_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stock_transfers table
CREATE TABLE public.stock_transfers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    receiver_name TEXT NOT NULL,
    product_id UUID NOT NULL REFERENCES public.products(id),
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status transfer_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    transferred_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE profiles.user_id = $1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create RLS policies for suppliers
CREATE POLICY "Everyone can view suppliers" ON public.suppliers FOR SELECT USING (true);
CREATE POLICY "Admins and managers can insert suppliers" ON public.suppliers FOR INSERT 
    WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'manager'));
CREATE POLICY "Admins and managers can update suppliers" ON public.suppliers FOR UPDATE 
    USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'));
CREATE POLICY "Only admins can delete suppliers" ON public.suppliers FOR DELETE 
    USING (public.get_user_role(auth.uid()) = 'admin');

-- Create RLS policies for products
CREATE POLICY "Everyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Staff and above can insert products" ON public.products FOR INSERT 
    WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff'));
CREATE POLICY "Staff and above can update products" ON public.products FOR UPDATE 
    USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff'));
CREATE POLICY "Only admins and managers can delete products" ON public.products FOR DELETE 
    USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE 
    USING (user_id = auth.uid());
CREATE POLICY "Only admins can insert profiles" ON public.profiles FOR INSERT 
    WITH CHECK (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Only admins can delete profiles" ON public.profiles FOR DELETE 
    USING (public.get_user_role(auth.uid()) = 'admin');

-- Create RLS policies for stock_receipts
CREATE POLICY "Everyone can view stock receipts" ON public.stock_receipts FOR SELECT USING (true);
CREATE POLICY "Staff and above can insert stock receipts" ON public.stock_receipts FOR INSERT 
    WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff'));
CREATE POLICY "Staff and above can update stock receipts" ON public.stock_receipts FOR UPDATE 
    USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff'));
CREATE POLICY "Only admins and managers can delete stock receipts" ON public.stock_receipts FOR DELETE 
    USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Create RLS policies for stock_transfers
CREATE POLICY "Everyone can view stock transfers" ON public.stock_transfers FOR SELECT USING (true);
CREATE POLICY "Staff and above can insert stock transfers" ON public.stock_transfers FOR INSERT 
    WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff'));
CREATE POLICY "Staff and above can update stock transfers" ON public.stock_transfers FOR UPDATE 
    USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff'));
CREATE POLICY "Only admins and managers can delete stock transfers" ON public.stock_transfers FOR DELETE 
    USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stock_receipts_updated_at BEFORE UPDATE ON public.stock_receipts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stock_transfers_updated_at BEFORE UPDATE ON public.stock_transfers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically update product quantities
CREATE OR REPLACE FUNCTION public.update_product_quantity_on_receipt()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.products 
    SET quantity = quantity + NEW.quantity
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_product_quantity_on_transfer()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' THEN
        UPDATE public.products 
        SET quantity = quantity - NEW.quantity
        WHERE id = NEW.product_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic quantity updates
CREATE TRIGGER update_quantity_on_receipt AFTER INSERT ON public.stock_receipts
    FOR EACH ROW EXECUTE FUNCTION public.update_product_quantity_on_receipt();

CREATE TRIGGER update_quantity_on_transfer AFTER UPDATE ON public.stock_transfers
    FOR EACH ROW EXECUTE FUNCTION public.update_product_quantity_on_transfer();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, username, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'username', NEW.email),
        NEW.email,
        'viewer'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_supplier_id ON public.products(supplier_id);
CREATE INDEX idx_stock_receipts_product_id ON public.stock_receipts(product_id);
CREATE INDEX idx_stock_receipts_supplier_id ON public.stock_receipts(supplier_id);
CREATE INDEX idx_stock_receipts_date ON public.stock_receipts(date);
CREATE INDEX idx_stock_transfers_product_id ON public.stock_transfers(product_id);
CREATE INDEX idx_stock_transfers_date ON public.stock_transfers(date);
CREATE INDEX idx_stock_transfers_status ON public.stock_transfers(status);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Insert sample data
INSERT INTO public.suppliers (name, contact_person, email, phone, address) VALUES
('Tech Suppliers Inc', 'John Smith', 'john@techsuppliers.com', '+1-555-0101', '123 Tech Street, Silicon Valley, CA'),
('Global Electronics', 'Sarah Johnson', 'sarah@globalelectronics.com', '+1-555-0102', '456 Electronics Blvd, Austin, TX'),
('Office Solutions Ltd', 'Mike Brown', 'mike@officesolutions.com', '+1-555-0103', '789 Business Ave, New York, NY');

INSERT INTO public.products (name, sku, category, quantity, stock_alert, unit, supplier_id) VALUES
('Laptop Computer', 'LAP-001', 'Electronics', 25, 5, 'pcs', (SELECT id FROM public.suppliers WHERE name = 'Tech Suppliers Inc' LIMIT 1)),
('Wireless Mouse', 'MOU-001', 'Electronics', 150, 20, 'pcs', (SELECT id FROM public.suppliers WHERE name = 'Global Electronics' LIMIT 1)),
('Office Chair', 'CHR-001', 'Furniture', 12, 3, 'pcs', (SELECT id FROM public.suppliers WHERE name = 'Office Solutions Ltd' LIMIT 1)),
('Smartphone', 'PHN-001', 'Electronics', 8, 5, 'pcs', (SELECT id FROM public.suppliers WHERE name = 'Tech Suppliers Inc' LIMIT 1)),
('Desk Lamp', 'LMP-001', 'Office Supplies', 45, 10, 'pcs', (SELECT id FROM public.suppliers WHERE name = 'Office Solutions Ltd' LIMIT 1));