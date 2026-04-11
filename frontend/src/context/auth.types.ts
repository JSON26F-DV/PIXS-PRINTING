export type RoleType = 'admin' | 'staff' | 'technician' | 'welder' | 'inventory' | 'customer' | 'guest' | 'banned';

export interface User {
  id?: string;
  name: string;
  role: RoleType;
  user_type?: 'employee' | 'customer' | 'deleted';
  isLoggedIn: boolean;
  email?: string;
}
