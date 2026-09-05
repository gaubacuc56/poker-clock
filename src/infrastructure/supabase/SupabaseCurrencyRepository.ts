import type { CurrencyRepository } from '@domain/ports';
import type { Currency } from '@domain/entities';
import { normalizeUnitCode } from '@domain/rules/currencyUnit';
import { supabase } from './client';
import type { Database } from './database.types';

type CurrencyRow = Database['public']['Tables']['currencies']['Row'];

function rowToCurrency(row: CurrencyRow): Currency {
  return {
    id: row.id,
    code: row.code,
    label: row.label,
    ownerId: row.owner_id ?? undefined,
  };
}

/**
 * Custom units sort after the standard ones. `sort_order` is what orders the two
 * shared units against each other; anything an account adds goes at the end of
 * the list in the order it was created, which is also the order it was thought
 * of in.
 */
const CUSTOM_UNIT_SORT_ORDER = 100;

export class SupabaseCurrencyRepository implements CurrencyRepository {
  async list(): Promise<Currency[]> {
    // RLS already limits this to the standard units and the caller's own —
    // there is no owner filter here because there is nothing else to see.
    const { data, error } = await supabase
      .from('currencies')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('code', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(rowToCurrency);
  }

  /**
   * Normalizing here rather than trusting the caller is deliberate: the column
   * has an uppercase CHECK on it, so a stray "chips" is a constraint error the
   * account has no way to read. This is the last place before the wire, and the
   * only one that has to be right.
   *
   * `label` is the same value. The screen asks for one name and the unit is that
   * name — a second column holding a second version of it could only ever drift.
   */
  async create(name: string): Promise<Currency> {
    const { data: auth } = await supabase.auth.getUser();
    const ownerId = auth.user?.id;
    if (!ownerId) throw new Error('Not signed in.');

    const code = normalizeUnitCode(name);
    if (!code) throw new Error('Enter a unit name.');

    const { data, error } = await supabase
      .from('currencies')
      .insert({
        code,
        label: code,
        owner_id: ownerId,
        sort_order: CUSTOM_UNIT_SORT_ORDER,
      })
      .select()
      .single();
    if (error) throw error;
    return rowToCurrency(data);
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('currencies').delete().eq('id', id);
    if (error) throw error;
  }
}
