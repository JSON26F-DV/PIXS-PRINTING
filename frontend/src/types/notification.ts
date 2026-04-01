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
  timestamp: string;
  sender: string;
  senderName: string;
  text: string;
}

export interface IOrder {
  id: string;
  status: string;
  product: string;
  customer: string;
  approved_at: string;
}
