// Shared Settings nav types — separated to avoid Fast Refresh warnings
import {
  FiUser,
  FiCreditCard,
  FiMapPin,
  FiPackage,
  FiGift,
  FiHelpCircle,
  FiFileText,
  FiLogOut,
} from 'react-icons/fi';

export type SectionKey =
  | 'account'
  | 'payment'
  | 'address'
  | 'orders'
  | 'awards'
  | 'help'
  | 'policies'
  | 'logout';

export interface NavItem {
  key: SectionKey;
  label: string;
  icon: React.ElementType;
  description: string;
}

import React from 'react';

export const NAV_ITEMS: NavItem[] = [
  { key: 'account', label: 'Account Info', icon: FiUser, description: 'Name, email, phone, password' },
  { key: 'payment', label: 'Payment Methods', icon: FiCreditCard, description: 'Saved cards & billing' },
  { key: 'address', label: 'Address Book', icon: FiMapPin, description: 'Shipping & delivery nodes' },
  { key: 'orders', label: 'My Orders', icon: FiPackage, description: 'Track & manage orders' },
  { key: 'awards', label: 'Awards & Discounts', icon: FiGift, description: 'Promo codes & vouchers' },
  { key: 'help', label: 'Help & Support', icon: FiHelpCircle, description: 'FAQ & contact' },
  { key: 'policies', label: 'Policies', icon: FiFileText, description: 'Terms, privacy, returns' },
  { key: 'logout', label: 'Logout', icon: FiLogOut, description: 'Sign out of session' },
];
