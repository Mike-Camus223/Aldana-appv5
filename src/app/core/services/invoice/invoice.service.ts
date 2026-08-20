import { Injectable } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { NotificationService } from '../notification.service';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  constructor(
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  /**
   * Descarga/Imprime la Factura o Comprobante para el Cliente (Consumidor Final o Factura A).
   * @param orderId ID único de la orden en Supabase
   * @param invoiceType 'B' (por defecto) o 'A' (con IVA discriminado)
   */
  async downloadInvoice(orderId: string, invoiceType: 'B' | 'A' = 'B'): Promise<void> {
    return this.requestInvoiceDocument(orderId, 'customer', invoiceType, 'Generando factura oficial...');
  }

  /**
   * Descarga/Imprime la Hoja de Despacho, Picking y Control Administrativo para la Vendedora / Taller.
   * @param orderId ID único de la orden en Supabase
   */
  async downloadAdminPackingSlip(orderId: string): Promise<void> {
    return this.requestInvoiceDocument(orderId, 'admin', 'B', 'Generando hoja de despacho y control...');
  }

  private async requestInvoiceDocument(
    orderId: string,
    type: 'customer' | 'admin',
    invoiceType: 'B' | 'A',
    loadingMessage: string
  ): Promise<void> {
    if (!orderId) {
      this.notificationService.showError('Error', 'ID de pedido no proporcionado');
      return;
    }

    // Abrir la ventana inmediatamente para evitar que los navegadores bloqueen el popup
    const popupWindow = window.open('', '_blank');
    if (popupWindow) {
      popupWindow.document.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <title>Generando documento...</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 80vh; color: #555; }
            .loader { border: 3px solid #f3f3f3; border-top: 3px solid #556F52; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin-right: 12px; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="loader"></div>
          <span>${loadingMessage}</span>
        </body>
        </html>
      `);
    }

    try {
      const supabase = this.authService.getAuthenticatedClient();

      const { data, error } = await supabase.functions.invoke('generate-invoice', {
        body: { 
          order_id: orderId, 
          type, 
          invoice_type: invoiceType, 
          format: 'json' 
        }
      });

      if (error || !data?.html) {
        console.error('Error invoking generate-invoice edge function:', error);
        if (popupWindow) popupWindow.close();
        this.notificationService.showError(
          'Error al emitir documento',
          error?.message || 'No se pudo generar el documento en el servidor.'
        );
        return;
      }

      if (popupWindow) {
        popupWindow.document.open();
        popupWindow.document.write(data.html);
        popupWindow.document.close();
      }
    } catch (err: any) {
      console.error('Error en InvoiceService:', err);
      if (popupWindow) popupWindow.close();
      this.notificationService.showError('Error', 'Ocurrió un error inesperado al conectar con el servidor.');
    }
  }
}
