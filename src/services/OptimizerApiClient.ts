import { supabase } from '@/integrations/supabase/client';

export interface Offer {
  id: string;
  price: number;
  moq?: number;
  step?: number;
  capacity?: number;
  share?: number;
}

export interface OptimizeRequest {
  quantity: number;
  offers: Offer[];
  budget?: number;
}

export interface OptimizeResponse {
  allocation: Record<string, number>;
  cost: number;
  violations: string[];
}

export class OptimizerApiClient {
  static async optimize(request: OptimizeRequest): Promise<OptimizeResponse> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase.functions.invoke('optimizer', {
      body: request,
    });

    if (error) {
      console.error('[OptimizerApiClient] Error:', error);
      throw error;
    }

    return data as OptimizeResponse;
  }
}
