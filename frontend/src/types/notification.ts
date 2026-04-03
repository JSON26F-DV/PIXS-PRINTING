export type INotification = {
  id: string;
  type: 'message' | 'complaint' | 'low_stock' | 'order_update';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  linkTo: string;
  severity?: 'low' | 'medium' | 'high';
}

export interface IComplaint {
  id: string;
  date: string;
  issue_type: string;
  description: string;
  severity?: string;
}

export interface IMessage {
  id: string;
  conversation_id: string;
  participants: string[];
  sender_id: string;
  receiver_id: string;
  message: string;
  attachments?: { type: 'image' | 'file'; url: string; name: string }[];
  is_read: boolean;
  created_at: string;
}

export interface IOrder {
  id: string;
  status: string;
  product: string;
  customer: string;
  approved_at: string;
}
