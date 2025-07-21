export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;         
  variantMainImage?: string; 
  color: string;
  size: string;
  quantity: number;
}
