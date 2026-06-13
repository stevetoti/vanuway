import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2, Plane, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export interface AirportPlace {
  iata_code: string;
  name: string;
  city_name: string;
  country: string;
  type: 'airport' | 'city' | string;
}

interface Props {
  id?: string;
  value: string;
  onChange: (iata: string, place?: AirportPlace) => void;
  placeholder?: string;
}

const cache = new Map<string, AirportPlace[]>();

export function AirportPicker({ id, value, onChange, placeholder = 'City or airport' }: Props) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<AirportPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults([]); return; }
    const key = q.toLowerCase();
    if (cache.has(key)) { setResults(cache.get(key)!); return; }

    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('duffel-places', { body: { query: q } });
        if (cancelled) return;
        if (error) {
          setResults([]);
        } else {
          const list = ((data?.places ?? []) as AirportPlace[]);
          cache.set(key, list);
          setResults(list);
          setActiveIdx(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 280);

    return () => { cancelled = true; clearTimeout(t); };
  }, [query]);

  const select = (p: AirportPlace) => {
    onChange(p.iata_code, p);
    setQuery(`${p.city_name} (${p.iata_code})`);
    setOpen(false);
  };

  const clear = () => {
    onChange('', undefined);
    setQuery('');
    setResults([]);
    setOpen(true);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); select(results[activeIdx]); }
    else if (e.key === 'Escape') { setOpen(false); }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        id={id}
        type="search"
        inputMode="search"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(e.target.value.trim().length >= 2); }}
        onKeyDown={onKey}
        placeholder={placeholder}
        autoComplete="off"
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {open && query.trim().length >= 2 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-72 overflow-auto">
          {loading && (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching airports…
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">No matches for "{query.trim()}"</div>
          )}
          {!loading && results.map((p, i) => (
            <button
              key={`${p.iata_code}-${p.type}-${i}`}
              type="button"
              onClick={() => select(p)}
              onMouseEnter={() => setActiveIdx(i)}
              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${i === activeIdx ? 'bg-muted' : ''}`}
            >
              <Plane className="h-3.5 w-3.5 shrink-0 text-blue-600" />
              <div className="flex-1 min-w-0">
                <div className="truncate">
                  <span className="font-medium">{p.city_name}</span>
                  {p.name !== p.city_name && <span className="text-muted-foreground"> · {p.name}</span>}
                </div>
                <div className="text-xs text-muted-foreground">{p.country}</div>
              </div>
              <span className="font-mono text-xs font-bold text-blue-600">{p.iata_code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
