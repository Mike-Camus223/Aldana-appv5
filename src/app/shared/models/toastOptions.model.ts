export type ToastSeverity = 'success' | 'error' | 'warn' | 'info';

export interface ToastMessage {
  id: string;
  severity: ToastSeverity;
  summary?: string;
  detail?: string;
  customContent?: string;
  life?: number;
  sticky?: boolean;
  state?: string;
  progressStart?: number;
  progressElapsed?: number;
}

