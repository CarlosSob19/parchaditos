import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import type { Drink } from '@/constants/config';
import { price } from '@/lib/booking';
import { useCatalog } from '@/lib/catalog';

const KEY = 'pedido-v1';
type Items = Record<string, number>;

type CartValue = {
  qty: (id: string) => number;
  set: (id: string, n: number) => void;
  add: (id: string, n?: number) => void;
  clear: () => void;
  lines: { drink: Drink; n: number }[];
  count: number;
  message: (note?: string) => string;
  sheet: boolean;
  open: () => void;
  close: () => void;
};

const CartContext = createContext<CartValue | null>(null);

// Pedido de varias bebidas que se manda en un solo mensaje de WhatsApp. Se guarda en el teléfono.
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Items>({});
  const [sheet, setSheet] = useState(false);
  const { drinks } = useCatalog();

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => v && setItems(JSON.parse(v)))
      .catch(() => {});
  }, []);

  const value = useMemo<CartValue>(() => {
    const save = (next: Items) => {
      setItems(next);
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
    };
    const set = (id: string, n: number) => {
      const next = { ...items };
      const v = Math.max(0, Math.min(20, n));
      if (v) next[id] = v;
      else delete next[id];
      save(next);
    };
    const lines = drinks.filter((d) => items[d.id] > 0 && !d.agotado).map((drink) => ({ drink, n: items[drink.id] }));
    const count = lines.reduce((s, l) => s + l.n, 0);
    const total = lines.reduce((s, l) => s + (l.drink.precio ?? 0) * l.n, 0);

    return {
      qty: (id) => items[id] ?? 0,
      set,
      add: (id, n = 1) => set(id, (items[id] ?? 0) + n),
      clear: () => save({}),
      lines,
      count,
      sheet,
      open: () => setSheet(true),
      close: () => setSheet(false),
      message: (note) => {
        const rows = lines.map(({ drink, n }) => `• ${n} x ${drink.nombre} (${drink.detalle})${drink.precio ? ` · ${price(drink.precio * n)}` : ''}`);
        const out = ['Hola Parchaditos, quiero hacer este pedido:', '', ...rows];
        if (total) out.push('', `Total: ${price(total)}${lines.some((l) => !l.drink.precio) ? ' + productos por consultar' : ''}`);
        if (note) out.push('', `Notas: ${note}`);
        return out.join('\n');
      },
    };
  }, [items, sheet, drinks]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
}
