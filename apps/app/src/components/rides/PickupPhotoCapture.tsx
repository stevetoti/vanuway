import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, User, Loader2, RefreshCcw, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PickupPhotoCaptureProps {
  rideId: string;
  /** Current path stored on the ride row, e.g. "<rideId>/<uuid>.jpg". Empty/null if no photo yet. */
  existingPath?: string | null;
  /** Called after a successful upload with the new path */
  onUploaded?: (path: string) => void;
}

const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.82;
const BUCKET = 'ride-pickup-photos';

/**
 * Compresses an image File client-side via a canvas before upload. Phone
 * selfies routinely come in at 5-10 MB which is wasteful on a slow Vanuatu
 * mobile connection — a passenger waiting at the cruise terminal typically
 * has weak signal. This step keeps uploads under ~500 KB while still being
 * readable on the driver's screen.
 */
async function compressImage(file: File): Promise<Blob> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('Failed to decode image'));
    i.src = dataUrl;
  });
  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not available');
  ctx.drawImage(img, 0, 0, w, h);
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('Compression failed')), 'image/jpeg', JPEG_QUALITY)
  );
}

/**
 * Asks the pickup-photo-sign edge function for a 1-hour signed URL. Reads
 * are blocked at the storage RLS layer — only the passenger or driver of the
 * ride (or an admin) can get a URL.
 */
async function fetchSignedUrl(rideId: string): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke('pickup-photo-sign', { body: { rideId } });
  if (error) {
    console.warn('pickup-photo-sign error', error);
    return null;
  }
  return (data?.url as string) || null;
}

export function PickupPhotoCapture({ rideId, existingPath, onUploaded }: PickupPhotoCaptureProps) {
  const [uploading, setUploading] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [hasPhoto, setHasPhoto] = useState<boolean>(!!existingPath);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const sceneInputRef = useRef<HTMLInputElement>(null);

  // Pull a fresh signed URL whenever there's a photo to display. Signed URLs
  // expire after 1 hour, so we re-fetch on mount; the underlying ride row's
  // pickup_photo_url is the source of truth.
  useEffect(() => {
    if (!hasPhoto) { setSignedUrl(null); return; }
    let cancelled = false;
    fetchSignedUrl(rideId).then(url => { if (!cancelled) setSignedUrl(url); });
    return () => { cancelled = true; };
  }, [hasPhoto, rideId]);

  useEffect(() => { setHasPhoto(!!existingPath); }, [existingPath]);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please pick an image file');
      return;
    }
    setUploading(true);
    try {
      const blob = await compressImage(file);
      // Path is "<rideId>/<uuid>.jpg" — storage RLS uses storage.foldername()
      // on the leading path segment to verify the caller owns this ride.
      const filename = `${crypto.randomUUID()}.jpg`;
      const path = `${rideId}/${filename}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, { upsert: true, contentType: 'image/jpeg', cacheControl: '300' });
      if (upErr) throw upErr;

      // Store the PATH (not full URL) in ride_bookings — signed URLs are
      // generated on demand by the edge function.
      const { error: dbErr } = await (supabase as unknown)
        .from('ride_bookings')
        .update({ pickup_photo_url: path, pickup_photo_uploaded_at: new Date().toISOString() })
        .eq('id', rideId);
      if (dbErr) throw dbErr;

      // Fetch a signed URL for the local preview right away.
      const url = await fetchSignedUrl(rideId);
      setSignedUrl(url);
      setHasPhoto(true);
      onUploaded?.(path);
      toast.success('Driver can now see your photo');
    } catch (e: unknown) {
      toast.error(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleUpload(f);
    e.target.value = '';
  };
  const onSceneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleUpload(f);
    e.target.value = '';
  };

  return (
    <Card className="p-3 space-y-2 border-blue-200 bg-blue-50/50">
      <div className="flex items-center gap-2">
        <Camera className="h-4 w-4 text-blue-600" />
        <p className="text-sm font-bold">Help the driver spot you</p>
      </div>
      <p className="text-xs text-muted-foreground">
        Snap a photo of yourself or what you're wearing — handy at busy spots like the airport or cruise terminal. Only your driver will see it, and it's deleted automatically when the ride ends.
      </p>

      {hasPhoto ? (
        <div className="space-y-2">
          <div className="relative rounded-lg overflow-hidden border border-blue-200 min-h-[80px] bg-white flex items-center justify-center">
            {signedUrl ? (
              <img src={signedUrl} alt="Pickup" className="w-full max-h-64 object-cover" />
            ) : (
              <div className="py-8 text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading preview…
              </div>
            )}
            {signedUrl && (
              <div className="absolute top-2 right-2 bg-green-600 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                <Check className="h-3 w-3" /> Visible to driver
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            disabled={uploading}
            onClick={() => selfieInputRef.current?.click()}
          >
            {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCcw className="h-4 w-4 mr-1" />}
            Retake
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="bg-white"
            disabled={uploading}
            onClick={() => selfieInputRef.current?.click()}
          >
            <User className="h-4 w-4 mr-1" />
            Take selfie
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="bg-white"
            disabled={uploading}
            onClick={() => sceneInputRef.current?.click()}
          >
            <Camera className="h-4 w-4 mr-1" />
            Photo
          </Button>
          {uploading && (
            <div className="col-span-2 flex items-center justify-center gap-2 text-xs text-muted-foreground py-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Uploading…
            </div>
          )}
        </div>
      )}

      {/* Hidden file inputs — the `capture` attribute opens the camera directly
          on mobile (user = front/selfie; environment = rear). Desktop falls
          back to the OS file picker. */}
      <input
        ref={selfieInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={onSelfieChange}
      />
      <input
        ref={sceneInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onSceneChange}
      />
    </Card>
  );
}
