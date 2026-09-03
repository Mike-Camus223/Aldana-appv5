export interface ProvinceOption {
  name: string;
  id: string;
}

export const ARGENTINA_PROVINCES: ProvinceOption[] = [
  { name: 'Ciudad Autónoma de Buenos Aires', id: 'CABA' },
  { name: 'Buenos Aires', id: 'BA' },
  { name: 'Córdoba', id: 'CB' },
  { name: 'Santa Fe', id: 'SF' },
  { name: 'Mendoza', id: 'MZ' },
  { name: 'Tucumán', id: 'TM' },
  { name: 'Salta', id: 'SA' },
  { name: 'Entre Ríos', id: 'ER' },
  { name: 'Misiones', id: 'MI' },
  { name: 'Chaco', id: 'CH' },
  { name: 'Corrientes', id: 'CT' },
  { name: 'Santiago del Estero', id: 'SE' },
  { name: 'San Juan', id: 'SJ' },
  { name: 'Jujuy', id: 'JU' },
  { name: 'Río Negro', id: 'RN' },
  { name: 'Neuquén', id: 'NQ' },
  { name: 'Formosa', id: 'FO' },
  { name: 'Chubut', id: 'CU' },
  { name: 'San Luis', id: 'SL' },
  { name: 'Catamarca', id: 'CA' },
  { name: 'La Rioja', id: 'LR' },
  { name: 'La Pampa', id: 'LP' },
  { name: 'Santa Cruz', id: 'SC' },
  { name: 'Tierra del Fuego', id: 'TF' }
];

// Alias para compatibilidad hacia atrás
export const provinces_arg = ARGENTINA_PROVINCES;
