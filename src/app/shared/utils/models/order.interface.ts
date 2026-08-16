export interface OrderProduct {
    id: string;
    name: string;
    quantity: number;
    price: number;
    color: string | null;
    size: string | null;
    image: string;
  }
  
  export interface OrderModel {
    id: string;
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
    products: OrderProduct[];
    subtotal: number;
    discount_applied?: number;
    discount_code?: string;
    discount_type?: 'percent' | 'fixed';
    total_final: number;
    status: 'pending' | 'in_transit' | 'completed' | 'rejected';
    payment_method?: 'mercadopago' | 'transfer' | 'cash';
    payment_status?: 'pending' | 'approved' | 'rejected' | 'in_process' | 'authorized' | 'in_mediation' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back';
    payment_id?: string;
    payment_mercadopago_id?: string;
    payment_mercadopago_status?: string;
    payment_mercadopago_status_detail?: string;
    payment_mercadopago_installments?: number;
    payment_mercadopago_payment_type?: string;
    payment_mercadopago_installment_amount?: number;
    payment_mercadopago_total_paid_amount?: number;
    whatsapp_message?: string;
    wamid?: string;
    created_at: string;
    updated_at: string;
    confirmed_at?: string;
    estimated_delivery_at?: string;
    delivered_at?: string;
    customer_notes?: string;
    seller_notes?: string;
    source_channel: string;
    customer_ip?: string;
    user_agent?: string;
    user_id: string;
  }
  
  export type Order = OrderModel;

  export interface OrderSummary {
    id: string;
    order_number: string;
    created_at: string;
    status: 'pending' | 'in_transit' | 'completed' | 'rejected';
    total_final: number;
    products: OrderProduct[];
    totalItems: number;
    payment_method?: 'mercadopago' | 'transfer' | 'cash';
    payment_status?: string;
  }