import { Injectable } from '@angular/core';
import { getDataHelperService } from '../data-access/getDataHelper.service';
import { CartItem } from '../../../shared/utils/models/cartItems-model';
import { ShippingData, DiscountData } from '../shipping.service';
import { AuthService } from '../auth/auth.service';

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
        customer_notes: undefined
      };

      // Usar el método autenticado del dataHelper
      const result = await this.dataHelper.insertWithAuth<{ id: string }>(
        'orders',
        orderData,
        'id'
      );

      const { data, error } = result;

      if (error) {
        console.error('Error creating order:', error);
        return { success: false, error: error.message };
      }

      return { success: true, orderId: data?.id };
    } catch (error: any) {
      console.error('Error in createOrder:', error);
      return { success: false, error: error.message || 'Error desconocido' };
    }
  }
}
