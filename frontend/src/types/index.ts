// Shared types for the FMCG Supply Chain frontend

export type ProductStatus =
  | 'REGISTERED' | 'IN_TRANSIT' | 'RECEIVED' | 'IN_STOCK'
  | 'SOLD' | 'DELIVERED' | 'QUARANTINED' | 'RECALLED' | 'DAMAGED' | 'EXPIRED';

export interface ProductType {
  id: string;
  on_chain_id?: string;
  sku_code: string;
  name: string;
  brand: string;
  category: string;
  description?: string;
  image_url?: string;
  manufacturer_address: string;
  manufacturer_name?: string;
  registered_at: number;
  tx_hash?: string;
  block_number?: number;
  batch_count?: number;
}

export interface Batch {
  id: string;
  on_chain_id?: string;
  product_type_id: string;
  batch_number: string;
  manufacturer_address: string;
  manufacturing_date: number;
  expiry_date: number;
  quantity: number;
  packaging_type?: string;
  current_owner: string;
  status: ProductStatus;
  is_recalled: number;
  recall_reason?: string;
  registered_at: number;
  tx_hash?: string;
  block_number?: number;
  // Joined fields
  product_name?: string;
  brand?: string;
  sku_code?: string;
  category?: string;
  unit_count?: number;
}

export interface Unit {
  id: string;
  on_chain_id?: string;
  batch_id: string;
  unit_serial: string;
  current_owner: string;
  status: ProductStatus;
  registered_at: number;
  tx_hash?: string;
  batch_number?: string;
  is_recalled?: number;
  recall_reason?: string;
  manufacturing_date?: number;
  expiry_date?: number;
  product_name?: string;
  brand?: string;
  sku_code?: string;
}

export interface Transfer {
  id: string;
  item_id: string;
  item_type: 'batch' | 'unit';
  from_address: string;
  to_address: string;
  shipment_ref?: string;
  status_after: ProductStatus;
  timestamp: number;
  tx_hash?: string;
  block_number?: number;
}

export interface Participant {
  id: string;
  wallet_address: string;
  name: string;
  role: 'ADMIN' | 'MANUFACTURER' | 'DISTRIBUTOR' | 'WAREHOUSE' | 'RETAILER' | 'CUSTOMER';
  company?: string;
  email?: string;
  is_active: number;
}

export interface AuditEntry {
  id: string;
  event_type: string;
  item_id?: string;
  item_type?: string;
  actor_address: string;
  description: string;
  tx_hash?: string;
  block_number?: number;
  tx_status: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REVERTED';
  timestamp: number;
}

export interface DashboardStats {
  totals: {
    products: number;
    batches: number;
    units: number;
    transfers: number;
    participants: number;
  };
  alerts: {
    recalled: number;
    near_expiry: number;
    expired: number;
    in_transit: number;
  };
  recent_activity: AuditEntry[];
  batch_status_breakdown: { status: string; count: number }[];
}

export interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export interface TxState {
  status: 'idle' | 'pending' | 'success' | 'error';
  hash?: string;
  error?: string;
}
