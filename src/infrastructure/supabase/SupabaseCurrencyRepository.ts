import type { CurrencyRepository } from '@domain/ports';
import type { Currency } from '@domain/entities';
import { supabase } from './client';

export class SupabaseCurrencyRepository implements CurrencyRepository {
  async list(): Promise<Currency[]> {
    const { data, error } = await supabase
      .from('currencies')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row) => ({ code: row.code, label: row.label }));
  }
}
