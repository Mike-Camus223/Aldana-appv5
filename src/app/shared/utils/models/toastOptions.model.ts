export interface ToastMessage {
  id: string;
  severity: 'success' | 'info' | 'warn' | 'error';
  summary?: string;
  detail?: string;
  life?: number; 
  sticky?: boolean;
}