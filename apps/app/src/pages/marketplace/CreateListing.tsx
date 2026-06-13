import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Camera, X, Loader2, MapPin
} from 'lucide-react';
import { MarketplaceCategory, LISTING_TYPES, CONDITIONS, VANUATU_ISLANDS } from '@/types/marketplace';

export default function CreateListing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Gate: only approved marketplace sellers can post listings.
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    (async () => {
      const { data } = await (supabase as unknown)
        .from('marketplace_sellers')
        .select('verification_status')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!data) {
        toast({ title: 'Apply to sell first', description: 'You need to register as a seller before posting listings.' });
        navigate('/marketplace/seller/register');
      } else if (data.verification_status !== 'verified') {
        navigate('/marketplace/seller/register');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    listing_type: 'sale',
    condition: 'good',
    price: '',
    price_negotiable: true,
    island: 'Efate',
    area: '',
    contact_phone: '',
    contact_whatsapp: '',
    show_phone: true,
  });
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ['marketplace-categories'],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown)
        .from('marketplace_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as MarketplaceCategory[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Login required');

      const price = formData.listing_type === 'free' ? 0 : parseInt(formData.price) || 0;

      const { data, error } = await (supabase as unknown)
        .from('marketplace_listings')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          listing_type: formData.listing_type,
          condition: formData.condition,
          price,
          price_negotiable: formData.price_negotiable,
          island: formData.island,
          area: formData.area || null,
          contact_phone: formData.contact_phone || null,
          contact_whatsapp: formData.contact_whatsapp || null,
          show_phone: formData.show_phone,
          images,
          status: 'draft', // pending admin approval before going public
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Listing Submitted',
        description: 'An admin will review and publish it shortly. You can find it under "My Listings".',
      });
      navigate(`/marketplace/my-listings`);
    },
    onError: (error: unknown) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create listing',
        variant: 'destructive',
      });
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 5) {
      toast({
        title: 'Too many images',
        description: 'Maximum 5 images allowed',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('marketplace')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('marketplace')
          .getPublicUrl(fileName);

        setImages(prev => [...prev, publicUrl]);
      }
    } catch (error: unknown) {
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({ title: 'Title required', variant: 'destructive' });
      return;
    }
    if (!formData.category) {
      toast({ title: 'Category required', variant: 'destructive' });
      return;
    }
    if (!formData.description.trim()) {
      toast({ title: 'Description required', variant: 'destructive' });
      return;
    }
    if (formData.listing_type !== 'free' && (!formData.price || parseInt(formData.price) <= 0)) {
      toast({ title: 'Valid price required', variant: 'destructive' });
      return;
    }

    createMutation.mutate();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Login Required</h2>
          <p className="text-muted-foreground mb-4">Please log in to post a listing</p>
          <Button onClick={() => navigate('/login')}>Login</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-purple-600 text-white">
        <div className="px-4 pt-4 pb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => navigate('/marketplace')}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold">Post New Listing</h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* Images */}
        <Card>
          <CardContent className="p-4">
            <Label className="text-base font-semibold mb-3 block">Photos (up to 5)</Label>
            <div className="flex flex-wrap gap-3">
              {images.map((url, idx) => (
                <div key={idx} className="relative w-20 h-20">
                  <img
                    src={url}
                    alt={`Upload ${idx + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    onClick={() => removeImage(idx)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50">
                  {uploading ? (
                    <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6 text-gray-400" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              First photo will be the cover image
            </p>
          </CardContent>
        </Card>

        {/* Title */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="What are you selling?"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                maxLength={100}
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your item in detail..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                maxLength={2000}
              />
            </div>
          </CardContent>
        </Card>

        {/* Listing Type & Condition */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div>
              <Label>Listing Type *</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {Object.entries(LISTING_TYPES).map(([key, info]) => (
                  <button
                    key={key}
                    type="button"
                    className={`p-3 rounded-lg border-2 text-center transition-colors ${
                      formData.listing_type === key
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setFormData({ ...formData, listing_type: key })}
                  >
                    <span className="text-lg">{info.icon}</span>
                    <p className="text-sm font-medium mt-1">{info.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {formData.listing_type !== 'free' && formData.listing_type !== 'wanted' && (
              <div>
                <Label>Condition</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) => setFormData({ ...formData, condition: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONDITIONS).map(([key, info]) => (
                      <SelectItem key={key} value={key}>
                        {info.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Price */}
        {formData.listing_type !== 'free' && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <Label htmlFor="price">
                  {formData.listing_type === 'wanted' ? 'Budget (VUV)' : 'Price (VUV) *'}
                </Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>

              {formData.listing_type === 'sale' && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="negotiable">Price is negotiable</Label>
                  <Switch
                    id="negotiable"
                    checked={formData.price_negotiable}
                    onCheckedChange={(checked) => setFormData({ ...formData, price_negotiable: checked })}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Location */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-purple-600 mb-2">
              <MapPin className="h-5 w-5" />
              <Label className="text-base font-semibold">Location</Label>
            </div>

            <div>
              <Label htmlFor="island">Island *</Label>
              <Select
                value={formData.island}
                onValueChange={(value) => setFormData({ ...formData, island: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VANUATU_ISLANDS.map((island) => (
                    <SelectItem key={island} value={island}>
                      {island}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="area">Area/Suburb</Label>
              <Input
                id="area"
                placeholder="e.g., Nambatu, Tassiriki"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Details */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <Label className="text-base font-semibold">Contact Details</Label>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+678 xxxxxxx"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="whatsapp">WhatsApp Number</Label>
              <Input
                id="whatsapp"
                type="tel"
                placeholder="+678 xxxxxxx"
                value={formData.contact_whatsapp}
                onChange={(e) => setFormData({ ...formData, contact_whatsapp: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show_phone">Show phone number publicly</Label>
              <Switch
                id="show_phone"
                checked={formData.show_phone}
                onCheckedChange={(checked) => setFormData({ ...formData, show_phone: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full h-12 bg-purple-600 hover:bg-purple-700"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Posting...
            </>
          ) : (
            'Post Listing'
          )}
        </Button>
      </form>
    </div>
  );
}
