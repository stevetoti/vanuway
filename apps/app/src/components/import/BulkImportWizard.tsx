import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Sparkles, Globe, Pencil, Trash2, ArrowLeft, FileSpreadsheet, Download, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { parseCsv, mapCsvToItems, buildCsvTemplate } from '@/lib/import/csv';

export type ImportVendorType =
  | 'restaurant'
  | 'hotel'
  | 'property'
  | 'tour'
  | 'shop'
  | 'marketplace'
  | 'car_rental'
  | 'spa'
  | 'ferry'
  | 'event';

export interface ImportedItem {
  // free-form because the shape varies per vendor type
  [key: string]: unknown;
  _selected?: boolean;
}

export interface BulkImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorType: ImportVendorType;
  /** Friendly label, e.g. "menu items", "rooms", "properties" */
  itemLabel: string;
  /** Columns to show in the preview table; first one becomes the row title */
  previewFields: { key: string; label: string; type?: 'text' | 'number' | 'image' }[];
  /** Called with the user-approved items. Should insert into the appropriate table. */
  onConfirm: (items: ImportedItem[], context: { sourceUrl?: string; mode: 'ai' | 'csv' }) => Promise<void>;
}

type Step = 'url' | 'scraping' | 'preview' | 'saving' | 'done';

const labelByType: Record<ImportVendorType, string> = {
  restaurant: 'restaurant',
  hotel: 'hotel',
  property: 'real estate',
  tour: 'tour operator',
  shop: 'shop',
  marketplace: 'marketplace seller',
  car_rental: 'car rental',
  spa: 'spa or salon',
  ferry: 'ferry operator',
  event: 'event organiser',
};

export function BulkImportWizard({
  open,
  onOpenChange,
  vendorType,
  itemLabel,
  previewFields,
  onConfirm,
}: BulkImportWizardProps) {
  const [step, setStep] = useState<Step>('url');
  const [mode, setMode] = useState<'ai' | 'csv'>('ai');
  const [url, setUrl] = useState('');
  const [crawl, setCrawl] = useState(false);
  const [items, setItems] = useState<ImportedItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep('url');
    setMode('ai');
    setUrl('');
    setCrawl(false);
    setItems([]);
    setError(null);
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const startScrape = async () => {
    setError(null);
    if (!url.trim()) {
      setError('Please paste your website URL');
      return;
    }
    let normalized = url.trim();
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = `https://${normalized}`;
    }
    setStep('scraping');
    try {
      const { data, error: fnError } = await supabase.functions.invoke('scrape-vendor-import', {
        body: { url: normalized, vendorType, crawl },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      const extracted: ImportedItem[] = (data?.items || []).map((it: unknown) => ({
        ...it,
        _selected: true,
      }));
      if (extracted.length === 0) {
        setError(`We could not find any ${itemLabel} on that page. Try a different page (often the menu or product list page works best).`);
        setStep('url');
        return;
      }
      setItems(extracted);
      setStep('preview');
    } catch (e: unknown) {
      setError(e.message || 'Failed to scan the page');
      setStep('url');
    }
  };

  const downloadTemplate = () => {
    const csv = buildCsvTemplate(vendorType);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vanuway-${vendorType}-template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCsvFile = async (file: File) => {
    setError(null);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length === 0) {
        setError('No rows found in this CSV. Make sure the first line is your column headers.');
        return;
      }
      const mapped = mapCsvToItems(rows, vendorType);
      const filtered = mapped.filter((it: unknown) => {
        const title = it.name || it.title || '';
        return String(title).trim() !== '';
      });
      if (filtered.length === 0) {
        setError('We could not read any items from that CSV. Try downloading the template above for the correct column names.');
        return;
      }
      const extracted: ImportedItem[] = filtered.map((it: unknown) => ({ ...it, _selected: true }));
      setItems(extracted);
      setStep('preview');
    } catch (e: unknown) {
      setError(e.message || 'Could not read the CSV file');
    }
  };

  const updateItem = (index: number, key: string, value: unknown) => {
    setItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const toggleAll = (checked: boolean) => {
    setItems(prev => prev.map(it => ({ ...it, _selected: checked })));
  };

  const selectedCount = items.filter(it => it._selected).length;

  const confirmImport = async () => {
    const approved = items.filter(it => it._selected).map(({ _selected, ...rest }) => rest);
    if (approved.length === 0) {
      toast.error('Select at least one item to import');
      return;
    }
    setStep('saving');
    try {
      let normalizedUrl: string | undefined;
      if (mode === 'ai' && url.trim()) {
        normalizedUrl = url.trim();
        if (!/^https?:\/\//i.test(normalizedUrl)) normalizedUrl = `https://${normalizedUrl}`;
      }
      await onConfirm(approved, { sourceUrl: normalizedUrl, mode });
      setStep('done');
    } catch (e: unknown) {
      setError(e.message || 'Failed to save imported items');
      setStep('preview');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-orange-500" />
            Bulk import {itemLabel}
          </DialogTitle>
          <DialogDescription>
            Move your existing {labelByType[vendorType]} catalog into VanuWay — pull from your website, or upload a spreadsheet.
          </DialogDescription>
        </DialogHeader>

        {step === 'url' && (
          <Tabs value={mode} onValueChange={(v) => { setMode(v as 'ai' | 'csv'); setError(null); }} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ai" className="gap-2">
                <Sparkles className="h-4 w-4" />
                AI website scan
              </TabsTrigger>
              <TabsTrigger value="csv" className="gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Upload CSV
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ai" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="import-url">Your website URL</Label>
                <div className="relative mt-1">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="import-url"
                    placeholder="https://your-restaurant.com/menu"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    className="pl-9"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Tip: link directly to the page that lists your {itemLabel} (e.g. /menu, /rooms, /listings). We render JavaScript and scroll the page to capture lazy-loaded items.
                </p>
                <p className="text-xs text-amber-600 mt-2 bg-amber-50 border border-amber-200 rounded p-2">
                  Some modern stores (Shopify, virtualized React/Next.js sites) load products as you scroll. If we only catch a few items, use the CSV tab instead.
                </p>
              </div>
              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                  {error}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
                <Button onClick={startScrape}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Scan website
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="csv" className="space-y-4 mt-4">
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                <p className="font-medium text-blue-900 mb-1">How CSV upload works</p>
                <ol className="list-decimal list-inside text-blue-800 space-y-0.5 text-xs">
                  <li>Download our template (correct column names for {labelByType[vendorType]})</li>
                  <li>Open it in Excel / Google Sheets and paste your products into the rows</li>
                  <li>Save as CSV and upload below — we'll preview every row before saving</li>
                </ol>
              </div>

              <Button variant="outline" onClick={downloadTemplate} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download {labelByType[vendorType]} template (.csv)
              </Button>

              <div>
                <Label>Upload your CSV file</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCsvFile(file);
                    if (e.target) e.target.value = '';
                  }}
                />
                <Button
                  variant="default"
                  className="w-full mt-1"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Choose CSV file
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  Up to 1,000 rows per upload. You'll be able to edit and remove items before saving.
                </p>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                  {error}
                </div>
              )}
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {step === 'scraping' && (
          <div className="py-12 flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
            <div className="text-center">
              <p className="font-medium">Reading your website…</p>
              <p className="text-sm text-muted-foreground">
                Rendering and scrolling the page — usually 30-60 seconds.
              </p>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm">
                Found <span className="font-semibold">{items.length}</span> {itemLabel}.
                {' '}
                <span className="text-muted-foreground">{selectedCount} selected.</span>
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => toggleAll(true)}>Select all</Button>
                <Button size="sm" variant="ghost" onClick={() => toggleAll(false)}>Clear</Button>
              </div>
            </div>

            <div className="border rounded-md divide-y max-h-[50vh] overflow-y-auto">
              {items.map((item, i) => (
                <div key={i} className="p-3 flex items-start gap-3">
                  <Checkbox
                    checked={!!item._selected}
                    onCheckedChange={(c) => updateItem(i, '_selected', !!c)}
                    className="mt-1"
                  />
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt=""
                      className="w-14 h-14 object-cover rounded flex-shrink-0 bg-muted"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded bg-muted flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    {previewFields.map(f => (
                      <EditableField
                        key={f.key}
                        value={item[f.key] ?? ''}
                        type={f.type}
                        label={f.label}
                        onChange={(v) => updateItem(i, f.key, v)}
                      />
                    ))}
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => removeItem(i)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                {error}
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep('url')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={confirmImport} disabled={selectedCount === 0}>
                Import {selectedCount} {itemLabel}
              </Button>
            </div>
          </div>
        )}

        {step === 'saving' && (
          <div className="py-12 flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
            <p className="font-medium">Saving to your VanuWay account…</p>
          </div>
        )}

        {step === 'done' && (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-lg">All set!</p>
              <p className="text-sm text-muted-foreground">
                Your {itemLabel} are now live on VanuWay.
              </p>
            </div>
            <Button onClick={() => handleClose(false)}>Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function EditableField({
  value,
  onChange,
  label,
  type = 'text',
}: {
  value: unknown;
  onChange: (v: unknown) => void;
  label: string;
  type?: 'text' | 'number' | 'image';
}) {
  const [editing, setEditing] = useState(false);

  if (type === 'image') return null; // handled separately

  if (editing) {
    return (
      <div className="mb-1">
        <Input
          type={type}
          value={value ?? ''}
          onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
          onBlur={() => setEditing(false)}
          autoFocus
          className="h-7 text-sm"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="block w-full text-left text-sm hover:bg-muted/50 rounded px-1 -mx-1"
    >
      <span className="text-xs text-muted-foreground mr-2">{label}:</span>
      <span className="truncate">{value ? String(value) : <em className="text-muted-foreground">empty</em>}</span>
      <Pencil className="inline h-3 w-3 ml-1 text-muted-foreground/40" />
    </button>
  );
}
