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
   * Abre la Factura / Comprobante en una pestaña independiente para previsualizar, imprimir o Guardar como PDF.
   * @param orderId ID único de la orden en Supabase
   * @param invoiceType 'B' (por defecto) o 'A' (con IVA discriminado)
   */
  async downloadInvoice(orderId: string, invoiceType: 'B' | 'A' = 'B'): Promise<void> {
    return this.requestInvoiceDocument(orderId, 'customer', invoiceType, 'Generando documento oficial...');
  }

  private async requestInvoiceDocument(
    orderId: string,
    type: 'customer',
    invoiceType: 'B' | 'A',
    loadingMessage: string
  ): Promise<void> {
    if (!orderId) {
      this.notificationService.showError('Error', 'ID de pedido no proporcionado');
      return;
    }

    this.notificationService.showInfo('Generando documento', loadingMessage);

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
        this.notificationService.showError(
          'Error al emitir documento',
          error?.message || 'No se pudo generar el documento en el servidor.'
        );
        return;
      }

      // Inyectar disparador de impresión/guardado en PDF automático de forma no bloqueante
      let fullHtml = data.html;
      const printScript = `
        <script>
          window.addEventListener('DOMContentLoaded', function() {
            setTimeout(function() {
              window.print();
            }, 300);
          });
        </script>
      `;

      if (fullHtml.includes('</body>')) {
        fullHtml = fullHtml.replace('</body>', `${printScript}</body>`);
      } else {
        fullHtml += printScript;
      }

      // Abrir en Blob URL con noopener para aislar completamente el hilo del navegador
      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);

      const openedWindow = window.open(blobUrl, '_blank', 'noopener,noreferrer');
      if (!openedWindow) {
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `comprobante-${orderId.slice(0, 8)}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 120000);

    } catch (err: any) {
      console.error('Error en InvoiceService:', err);
      this.notificationService.showError('Error', 'Ocurrió un error inesperado al conectar con el servidor.');
    }
  }
}
