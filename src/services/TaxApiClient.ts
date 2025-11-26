import { supabase } from '@/integrations/supabase/client';

export interface TaxRequest {
  ncm: string;
  uf: string;
  date: string;
}

export interface TaxResponse {
  ibs: number;
  cbs: number;
  is: number;
  explanation: string | null;
}

export class TaxApiClient {
  static async calculateTaxes(request: TaxRequest): Promise<TaxResponse> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase.functions.invoke('tax-engine', {
      body: request,
    });

    if (error) {
      console.error('[TaxApiClient] Error:', error);
      throw error;
    }

    return data as TaxResponse;
  }

  static async batchCalculateTaxes(requests: TaxRequest[]): Promise<TaxResponse[]> {
    return Promise.all(requests.map(req => this.calculateTaxes(req)));
  }
}
