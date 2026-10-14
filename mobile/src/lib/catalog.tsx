import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';

import { DOMINIO, type Drink, DRINKS, LOYVERSE } from '@/constants/config';

// Catálogo desde Loyverse, leído de la misma función que usa la web (web/js/loyverse.js hace lo mismo).
// Orden: última copia guardada en el teléfono → Loyverse en vivo. Si Loyverse está apagado o nunca respondió, DRINKS.

const KEY = 'catalogo-v1';
const TIMEOUT_MS = 8000;

type Remote = { categoria: string; nombre: string; detalle: string; precio: number | null; agotado: boolean; img: string | null };
type Catalog = { drinks: Drink[]; source: 'loyverse' | 'local' };

const CatalogContext = createContext<Catalog>({ drinks: DRINKS, source: 'local' });

// Mismo id que arma la web, para que un producto se llame igual en los dos lados.
const slug = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function toDrinks(list: Remote[]): Drink[] {
  const seen = new Set<string>();
  return list
    .filter((p) => LOYVERSE.categorias[p.categoria])
    .map((p) => {
      // La foto local de DRINKS (mismo nombre) gana sobre la de Loyverse.
      const local = DRINKS.find((d) => d.nombre.toLowerCase() === p.nombre.toLowerCase());
      let id = slug(`${p.nombre} ${p.detalle}`) || 'producto';
      while (seen.has(id)) id += '-2';
      seen.add(id);
      return {
        id,
        cat: LOYVERSE.categorias[p.categoria],
        nombre: p.nombre,
        detalle: p.detalle || local?.detalle || '',
        precio: p.precio,
        img: local?.img ?? (p.img ? { uri: p.img } : null),
        agotado: Boolean(p.agotado),
      };
    });
}

async function fetchRemote(): Promise<Remote[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${DOMINIO}/api/catalogo`, { headers: { Accept: 'application/json' }, signal: ctrl.signal });
    if (!res.ok) throw new Error(`catalogo ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.productos)) throw new Error('respuesta sin productos');
    return data.productos;
  } finally {
    clearTimeout(timer);
  }
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<Catalog>({ drinks: DRINKS, source: 'local' });

  useEffect(() => {
    if (!LOYVERSE.activo || DOMINIO.includes('TU-DOMINIO')) return;
    let alive = true;
    let fresh = false; // si Loyverse ya respondió, la copia guardada (más vieja) no la pisa
    const apply = (list: Remote[]) => {
      const drinks = toDrinks(list);
      if (alive && drinks.length) setCatalog({ drinks, source: 'loyverse' });
      return drinks.length > 0;
    };

    AsyncStorage.getItem(KEY)
      .then((v) => v && !fresh && apply(JSON.parse(v)))
      .catch(() => {});

    fetchRemote()
      .then((list) => {
        fresh = true;
        if (apply(list)) AsyncStorage.setItem(KEY, JSON.stringify(list)).catch(() => {});
      })
      .catch((err) => console.warn('Loyverse no respondió, uso la copia guardada o DRINKS:', err.message));

    return () => {
      alive = false;
    };
  }, []);

  return <CatalogContext.Provider value={catalog}>{children}</CatalogContext.Provider>;
}

export const useCatalog = () => useContext(CatalogContext);
