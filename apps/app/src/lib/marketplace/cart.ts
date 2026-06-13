import { useEffect, useState, useCallback } from 'react';

export interface CartLine {
  listingId: string;
  title: string;
  image?: string;
  price: number;
  sellerId: string;
  quantity: number;
}

const KEY = 'vanuway_marketplace_cart_v1';

function read(): CartLine[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: CartLine[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('vanuway:cart-changed'));
}

export function useCart() {
  const [items, setItems] = useState<CartLine[]>(() => read());

  useEffect(() => {
    const sync = () => setItems(read());
    window.addEventListener('vanuway:cart-changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('vanuway:cart-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const add = useCallback((line: Omit<CartLine, 'quantity'> & { quantity?: number }) => {
    const next = read();
    const existing = next.find(l => l.listingId === line.listingId);
    if (existing) {
      existing.quantity += line.quantity ?? 1;
    } else {
      next.push({ ...line, quantity: line.quantity ?? 1 });
    }
    write(next);
  }, []);

  const setQuantity = useCallback((listingId: string, quantity: number) => {
    const next = read()
      .map(l => (l.listingId === listingId ? { ...l, quantity: Math.max(1, Math.floor(quantity)) } : l))
      .filter(l => l.quantity > 0);
    write(next);
  }, []);

  const remove = useCallback((listingId: string) => {
    write(read().filter(l => l.listingId !== listingId));
  }, []);

  const clear = useCallback(() => write([]), []);

  const totalItems = items.reduce((s, l) => s + l.quantity, 0);
  const totalVuv = items.reduce((s, l) => s + l.price * l.quantity, 0);

  return { items, add, setQuantity, remove, clear, totalItems, totalVuv };
}
