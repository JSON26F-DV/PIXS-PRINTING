export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'inventory' | 'designer';
  status: 'active' | 'inactive';
  contact_numbers?: { number: string; is_default: boolean; }[];
  contact_number?: string;
  company_name: string;
  business_address: string;
  password?: string;
  date_created: string;
  last_login: string;
  total_orders_value: number;
  daily_rate: number;
  ot_rate: number;
}

export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  contact_numbers?: { number: string; is_default: boolean; }[];
  contact_number?: string;
  type?: 'retail' | 'wholesale';
  status: 'active' | 'inactive';
  company_name: string;
  business_address: string;
  password?: string;
  date_created: string;
  last_login: string;
  total_orders_value: number;
  orders: number;
}

export interface AttendanceLog {
  id: string;
  employee_id: string;
  date: string; // 'yyyy-MM-dd'
  status: 'Present' | 'Absent' | 'Late' | 'Pending';
  time_in?: string | null;
  time_out?: string | null;
  ot_hours: number;
  is_half_day: boolean;
  is_holiday: boolean;
}

export interface Product {
    id: string;
    name: string;
    description?: string;
    short_description?: string;
    long_description?: string;
    category: string;
    price?: number;
    base_price?: number;
    raw_material_cost?: number;
    size?: string;
    min_order?: number;
    print_method?: string;
    current_stock: number;
    min_threshold: number;
    last_restocked?: string;
    total_sales_volume?: number;
    image?: string;
}

export interface RestockLog {
    id: string;
    product_id: string;
    qty_added: number;
    date: string;
    staff_name: string;
    notes?: string;
}

export interface Complaint {
    id: string;
    order_id: string;
    customer_id: string;
    issue_type: string;
    description: string;
    status: 'Open' | 'In Review' | 'Resolved' | 'rejected' | 'in_progress';
    severity: 'Low' | 'Med' | 'High';
    date: string;
    photo_url?: string;
}

export interface User {
    name: string;
    role: 'admin' | 'staff' | 'inventory' | 'customer';
}
