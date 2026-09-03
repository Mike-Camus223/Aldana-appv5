import { Injectable } from '@angular/core';
import { DataHelperService } from '../../../core/data-access/data-helper.service';

@Injectable({
  providedIn: 'root'
})
export class CuponserviceService {
  constructor(
    private helper: DataHelperService
  ) {}
    async validateCoupon(code: string): Promise<{
    valid: boolean;
    discountAmount?: number;
    discountType?: 'percent' | 'fixed';
    error?: string;
  }> {
    const { data, error } = await this.helper.client
      .from('discount_codes')
      .select('id, code, discount_type, amount, is_active, expires_at')
      .eq('code', code)
      .single();

    if (error || !data) {
      return { valid: false, error: 'Cupón no encontrado.' };
    }

    if (!data.is_active) {
      return { valid: false, error: 'Cupón inactivo.' };
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { valid: false, error: 'Cupón expirado.' };
    }

    return {
      valid: true,
      discountAmount: data.amount,
      discountType: data.discount_type
    };
  }
}
