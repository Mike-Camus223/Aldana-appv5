import { Injectable } from '@angular/core';
import { getDataHelperService } from '../data-access/getDataHelper.service';
import { CartItem } from '../../../shared/utils/models/cartItems-model';
import { ShippingData, DiscountData } from '../shipping.service';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../../environments/environment';
import { OrderModel, OrderSummary } from '../../../shared/utils/models/order.interface';
import { Order } from '../../../shared/components/templates/order-status/order-status.component';

export interface OrderData {
  order_number: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  customer_phone: string;
  address_street: string;
  address_number: string;
  address_apartment?: string;
  postal_code: string;
  neighborhood?: string;
  city: string;
  province: string;
  invoice_to_company?: boolean;
  dni_cuit?: string;
  company_name?: string;
  is_other_person?: boolean;
  receiver_first_name?: string;
  receiver_last_name?: string;
  products: any;
  subtotal: number;
  discount_applied?: number;
  discount_code?: string;
  discount_type?: string;
  total_final: number;
  status: string;
  whatsapp_message?: string;
  source_channel: string;
  customer_notes?: string;
  user_id: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrdersService {

  constructor(
    private dataHelper: getDataHelperService,
    private authService: AuthService
  ) { }

  generateOrderNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp}-${random}`;
  }

  async createOrder(
    cartItems: CartItem[],
    shippingData: ShippingData,
    discountData: DiscountData | null,
    subtotal: number,
    total: number,
    whatsappMessage: string
  ): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {
      if (!this.authService.isAuthenticated()) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      const currentUser = this.authService.getCurrentUser();
      if (!currentUser?.email) {
        return { success: false, error: 'No se pudo verificar la identidad del usuario' };
      }

      // La seguridad de la orden está garantizada por user_id + RLS de Supabase.
      // El email del formulario de envío es solo para logística/notificaciones
      // y puede diferir del email de la cuenta (ej: pedido para otra persona).

      const orderNumber = this.generateOrderNumber();
      
      const addressParts = shippingData.address.split(' ');
      const addressNumber = addressParts[addressParts.length - 1];
      const addressStreet = addressParts.slice(0, -1).join(' ');

      const orderData: OrderData = {
        order_number: orderNumber,
        customer_first_name: shippingData.name,
        customer_last_name: shippingData.surname,
        customer_email: shippingData.email,
        customer_phone: shippingData.phone,
        address_street: addressStreet,
        address_number: addressNumber,
        address_apartment: shippingData.apartment || undefined,
        postal_code: shippingData.zipCode,
        neighborhood: shippingData.neighborhood || undefined,
        city: shippingData.city,
        province: shippingData.province,
        invoice_to_company: shippingData.invoiceToCompany || false,
        dni_cuit: shippingData.dniOrCuit || undefined,
        company_name: shippingData.razonSocial || undefined,
        is_other_person: false,
        receiver_first_name: shippingData.name,
        receiver_last_name: shippingData.surname,
        products: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          color: item.color || null,
          size: item.size || null,
          image: item.variantMainImage || item.image
        })),
        subtotal: subtotal,
        discount_applied: discountData ? discountData.discountAmount : 0,
        discount_code: discountData?.code || undefined,
        discount_type: discountData?.discountType || undefined,
        total_final: total,
        status: 'pending',
        whatsapp_message: whatsappMessage,
        source_channel: 'web',
        customer_notes: undefined,
        user_id: currentUser.id
      };

      // 🔧 USAR DIRECTAMENTE EL CLIENTE AUTENTICADO
      const supabaseClient = this.authService.getAuthenticatedClient();
      
      // Verificar sesión antes de insertar
      const { data: { session } } = await supabaseClient.auth.getSession();

      console.log('🔍 DEBUG - Estado de autenticación:', {
        hasSession: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        accessToken: session?.access_token ? 'Present' : 'Missing',
        orderData: orderData
      });

      if (!session) {
        console.error('❌ No hay sesión activa');
        return { success: false, error: 'No hay sesión activa' };
      }

      console.log('📤 Intentando insertar orden en Supabase...');

      // Insertar directamente con el cliente autenticado
      const { data, error } = await supabaseClient
        .from('orders')
        .insert(orderData)
        .select('id')
        .single();

      console.log('📝 Resultado de inserción:', {
        success: !error,
        error: error?.message,
        errorDetails: error,
        data: data
      });

      if (error) {
        console.error('❌ Error creating order:', error);
        return { success: false, error: error.message };
      }

      return { success: true, orderId: data?.id };
    } catch (error: any) {
      console.error('Error in createOrder:', error);
      return { success: false, error: error.message || 'Error desconocido' };
    }
  }


  async getUserOrders(): Promise<{ success: boolean; orders?: OrderSummary[]; error?: string }> {
    try {
      if (!this.authService.isAuthenticated()) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      const currentUser = this.authService.getCurrentUser();
      if (!currentUser?.id) {
        return { success: false, error: 'No se pudo verificar la identidad del usuario' };
      }

      const supabaseClient = this.authService.getAuthenticatedClient();
      
      const { data, error } = await supabaseClient
        .from('orders')
        .select(`
          id,
          order_number,
          created_at,
          status,
          total_final,
          products
        `)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error obteniendo órdenes del usuario:', error);
        return { success: false, error: error.message };
      }

      const orderSummaries: OrderSummary[] = (data || []).map(order => ({
        id: order.id,
        order_number: order.order_number,
        created_at: order.created_at,
        status: order.status,
        total_final: order.total_final,
        products: order.products || [],
        totalItems: Array.isArray(order.products) ? order.products.reduce((sum: number, product: any) => sum + (product.quantity || 0), 0) : 0
      }));

      return { success: true, orders: orderSummaries };

    } catch (error: any) {
      console.error('Error en getUserOrders:', error);
      return { success: false, error: error.message || 'Error desconocido' };
    }
  }



  async getUserOrderById(orderId: string): Promise<{ success: boolean; order?: Order; error?: string }> {
    try {
      if (!this.authService.isAuthenticated()) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      const currentUser = this.authService.getCurrentUser();
      if (!currentUser?.id) {
        return { success: false, error: 'No se pudo verificar la identidad del usuario' };
      }

      const supabaseClient = this.authService.getAuthenticatedClient();
      
      const { data, error } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('user_id', currentUser.id)
        .single();

      if (error) {
        console.error('Error obteniendo orden específica:', error);
        return { success: false, error: 'Orden no encontrada o no tienes permisos para verla' };
      }

      return { success: true, order: data as Order };

    } catch (error: any) {
      console.error('Error en getUserOrderById:', error);
      return { success: false, error: error.message || 'Error desconocido' };
    }
  }

  /**
   * Ejecuta limpieza manual de órdenes pendientes mayores a 3 días
   */
  async cleanupPendingOrders(): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    try {
      if (!this.authService.isAuthenticated()) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      console.log('🧹 Ejecutando limpieza manual de órdenes pendientes...');

      const response = await fetch(`${environment.SUPABASE_URL}/functions/v1/cleanup-pending-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': environment.SUPABASE_KEY,
          'Authorization': `Bearer ${environment.SUPABASE_KEY}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        console.log(`✅ Limpieza completada: ${result.deletedCount} órdenes eliminadas`);
        return { 
          success: true, 
          deletedCount: result.deletedCount 
        };
      } else {
        return { success: false, error: result.error };
      }

    } catch (error: any) {
      console.error('Error en limpieza manual:', error);
      return { success: false, error: error.message || 'Error desconocido' };
    }
  }

  /**
   * Obtiene órdenes pendientes mayores a 3 días (para preview antes de eliminar)
   */
  async getPendingOrdersToCleanup(): Promise<{ success: boolean; orders?: any[]; error?: string }> {
    try {
      if (!this.authService.isAuthenticated()) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      const supabaseClient = this.authService.getAuthenticatedClient();
      
      // Calcular fecha límite (3 días atrás)
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const cutoffDate = threeDaysAgo.toISOString();

      const { data, error } = await supabaseClient
        .from('orders')
        .select('id, order_number, customer_email, customer_first_name, customer_last_name, created_at, total_final')
        .eq('status', 'pending')
        .lt('created_at', cutoffDate)
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, orders: data || [] };

    } catch (error: any) {
      console.error('Error obteniendo órdenes para limpieza:', error);
      return { success: false, error: error.message || 'Error desconocido' };
    }
  }

  /**
   * Obtiene todas las órdenes del sistema (para administradores)
   */
  async getAllOrdersAdmin(): Promise<{ success: boolean; orders?: any[]; error?: string }> {
    try {
      if (!this.authService.isAuthenticated()) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      const supabaseClient = this.authService.getAuthenticatedClient();
      
      const { data, error } = await supabaseClient
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, orders: data || [] };
    } catch (error: any) {
      console.error('Error en getAllOrdersAdmin:', error);
      return { success: false, error: error.message || 'Error desconocido' };
    }
  }

  /**
   * Actualiza el estado de una orden y registra el historial (para administradores)
   */
  async updateOrderStatusAdmin(
    orderId: string, 
    oldStatus: string, 
    newStatus: string, 
    comment: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.authService.isAuthenticated()) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      const supabaseClient = this.authService.getAuthenticatedClient();

      // 1. Actualizar orden
      const { error: updateError } = await supabaseClient
        .from('orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // 2. Registrar en historial de estados
      const { error: historyError } = await supabaseClient
        .from('orders_status_history')
        .insert({
          order_id: orderId,
          old_status: oldStatus,
          new_status: newStatus,
          comment: comment,
          changed_by: 'admin_dashboard'
        });

      if (historyError) {
        console.error('Error al registrar historial de estado:', historyError);
        // No bloqueamos el éxito principal
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error en updateOrderStatusAdmin:', error);
      return { success: false, error: error.message || 'Error desconocido' };
    }
  }
}

