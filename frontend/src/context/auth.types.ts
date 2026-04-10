export type RoleType = 'admin' | 'staff' | 'technician' | 'welder' | 'inventory' | 'customer' | 'guest';

export interface User {
  id?: string;
  name: string;
  role: RoleType;
  isLoggedIn: boolean;
  email?: string;
}
