import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface ShippingRate {
  deliveryType: 'D' | 'S';
  name: string;
  price: number;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
}

export interface Agency {
  code: string;
  name: string;
  streetName: string;
  streetNumber: string;
  city: string;
  provinceCode: string;
  hours?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MiCorreoService {
  private readonly baseUrl = `${environment.SUPABASE_URL}/functions/v1/correo-argentino`;
  private readonly apikey = environment.SUPABASE_KEY;

  async getRates(postalCodeDestination: string, items: Array<{ id: string; quantity: number }>): Promise<ShippingRate[]> {
    try {
      const response = await fetch(`${this.baseUrl}/rates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apikey,
          'Authorization': `Bearer ${this.apikey}`
        },
        body: JSON.stringify({
          postalCodeDestination,
          items
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `HTTP error ${response.status}`);
      }

      const res = await response.json();
      return res.rates || [];
    } catch (error) {
      console.error('Error in MiCorreoService.getRates:', error);
      throw error;
    }
  }

  async getAgencies(provinceCode: string): Promise<Agency[]> {
    try {
      const response = await fetch(`${this.baseUrl}/agencies?provinceCode=${provinceCode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apikey,
          'Authorization': `Bearer ${this.apikey}`
        }
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `HTTP error ${response.status}`);
      }

      const res = await response.json();
      return res.agencies || [];
    } catch (error) {
      console.error('Error in MiCorreoService.getAgencies:', error);
      throw error;
    }
  }
}
