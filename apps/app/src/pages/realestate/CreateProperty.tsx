import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Camera, X, Loader2, MapPin, Home, DollarSign, Phone
} from 'lucide-react';
import {
  LISTING_TYPES, PROPERTY_TYPES, PRICE_PERIODS,
  VANUATU_ISLANDS, COMMON_FEATURES, COMMON_AMENITIES
} from '@/types/property';

export default function CreateProperty() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    property_type: '',
    listing_type: 'rent',
    price: '',
    price_period: 'per_month',
    price_negotiable: false,
    island: 'Efate',
    area: '',
    address: '',
    bedrooms: '0',
    bathrooms: '0',
    land_size: '',
    floor_size: '',
    year_built: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    contact_whatsapp: '',
    show_contact: true,
  });

  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Login required');

      const { data, error } = await (supabase as any)
        .from('properties')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          property_type: formData.property_type,
          listing_type: formData.listing_type,
          price: parseFloat(formData.price) || 0,
          price_period: formData.listing_type === 'sale' ? 'total' : formData.price_period,
          price_negotiable: formData.price_negotiable,
          island: formData.island,
          area: formData.area || null,
          address: formData.address || null,
          bedrooms: parseInt(formData.bedrooms) || 0,
          bathrooms: parseInt(formData.bathrooms) || 0,
          land_size: formData.land_size ? parseFloat(formData.land_size) : null,
          floor_size: formData.floor_size ? parseFloat(formData.floor_size) : null,
          year_built: formData.year_built ? parseInt(formData.year_built) : null,
          features: selectedFeatures,
          amenities: selectedAmenities,
          images,
          contact_name: formData.contact_name || null,
          contact_phone: formData.contact_phone || null,
          contact_email: formData.contact_email || null,
          contact_whatsapp: formData.contact_whatsapp || null,
          show_contact: formData.show_contact,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Property Listed!',
        description: 'Your property has been posted successfully.',
      });
      navigate(`/realestate/${data.id}`);
    },
    onError: (error: any) => {
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

    if (images.length + files.length > 10) {
      toast({
        title: 'Too many images',
        description: 'Maximum 10 images allowed',
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
          .from('properties')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('properties')
          .getPublicUrl(fileName);

        setImages(prev => [...prev, publicUrl]);
      }
    } catch (error: any) {
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

  const toggleFeature = (feature: string) => {
    setSelectedFeatures(prev =>
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({ title: 'Title required', variant: 'destructive' });
      return;
    }
    if (!formData.property_type) {
      toast({ title: 'Property type required', variant: 'destructive' });
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
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
          <p className="text-muted-foreground mb-4">Please log in to list a property</p>
          <Button onClick={() => navigate('/login')}>Login</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-emerald-600 text-white">
        <div className="px-4 pt-4 pb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => navigate('/realestate')}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold">List Your Property</h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* Images */}
        <Card>
          <CardContent className="p-4">
            <Label className="text-base font-semibold mb-3 block">Photos (up to 10)</Label>
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
              {images.length < 10 && (
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

        {/* Basic Info */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <Home className="h-5 w-5" />
              <Label className="text-base font-semibold">Property Details</Label>
            </div>

            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Modern 3-Bedroom House with Ocean Views"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                maxLength={100}
              />
            </div>

            <div>
              <Label htmlFor="property_type">Property Type *</Label>
              <Select
                value={formData.property_type}
                onValueChange={(value) => setFormData({ ...formData, property_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((type) => (
                    <SelectItem key={type.name} value={type.name}>
                      {type.icon} {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Listing Type *</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {Object.entries(LISTING_TYPES).map(([key, info]) => (
                  <button
                    key={key}
                    type="button"
                    className={`p-3 rounded-lg border-2 text-center transition-colors ${
                      formData.listing_type === key
                        ? 'border-emerald-500 bg-emerald-50'
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

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your property..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                maxLength={2000}
              />
            </div>
          </CardContent>
        </Card>

        {/* Rooms & Size */}
        {formData.property_type !== 'Land' && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <Label className="text-base font-semibold">Rooms & Size</Label>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Select
                    value={formData.bedrooms}
                    onValueChange={(value) => setFormData({ ...formData, bedrooms: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num === 0 ? 'Studio/None' : num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Select
                    value={formData.bathrooms}
                    onValueChange={(value) => setFormData({ ...formData, bathrooms: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4, 5, 6].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="floor_size">Floor Size (m²)</Label>
                  <Input
                    id="floor_size"
                    type="number"
                    placeholder="e.g., 150"
                    value={formData.floor_size}
                    onChange={(e) => setFormData({ ...formData, floor_size: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="land_size">Land Size (m²)</Label>
                  <Input
                    id="land_size"
                    type="number"
                    placeholder="e.g., 800"
                    value={formData.land_size}
                    onChange={(e) => setFormData({ ...formData, land_size: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Land only */}
        {formData.property_type === 'Land' && (
          <Card>
            <CardContent className="p-4">
              <div>
                <Label htmlFor="land_size">Land Size (m²) *</Label>
                <Input
                  id="land_size"
                  type="number"
                  placeholder="e.g., 2000"
                  value={formData.land_size}
                  onChange={(e) => setFormData({ ...formData, land_size: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Price */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <DollarSign className="h-5 w-5" />
              <Label className="text-base font-semibold">Pricing</Label>
            </div>

            <div>
              <Label htmlFor="price">Price (VUV) *</Label>
              <Input
                id="price"
                type="number"
                placeholder="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>

            {formData.listing_type !== 'sale' && (
              <div>
                <Label>Price Period</Label>
                <Select
                  value={formData.price_period}
                  onValueChange={(value) => setFormData({ ...formData, price_period: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRICE_PERIODS).map(([key, info]) => (
                      <SelectItem key={key} value={key}>
                        {info.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label htmlFor="negotiable">Price is negotiable</Label>
              <Switch
                id="negotiable"
                checked={formData.price_negotiable}
                onCheckedChange={(checked) => setFormData({ ...formData, price_negotiable: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
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
                placeholder="e.g., Nambatu, Pango"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                placeholder="Optional - exact address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardContent className="p-4">
            <Label className="text-base font-semibold mb-3 block">Features</Label>
            <div className="grid grid-cols-2 gap-2">
              {COMMON_FEATURES.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={`feature-${feature}`}
                    checked={selectedFeatures.includes(feature)}
                    onCheckedChange={() => toggleFeature(feature)}
                  />
                  <label
                    htmlFor={`feature-${feature}`}
                    className="text-sm cursor-pointer"
                  >
                    {feature}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Amenities */}
        <Card>
          <CardContent className="p-4">
            <Label className="text-base font-semibold mb-3 block">Amenities</Label>
            <div className="grid grid-cols-2 gap-2">
              {COMMON_AMENITIES.map((amenity) => (
                <div
                  key={amenity}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={`amenity-${amenity}`}
                    checked={selectedAmenities.includes(amenity)}
                    onCheckedChange={() => toggleAmenity(amenity)}
                  />
                  <label
                    htmlFor={`amenity-${amenity}`}
                    className="text-sm cursor-pointer"
                  >
                    {amenity}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <Phone className="h-5 w-5" />
              <Label className="text-base font-semibold">Contact Details</Label>
            </div>

            <div>
              <Label htmlFor="contact_name">Contact Name</Label>
              <Input
                id="contact_name"
                placeholder="Your name"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="contact_phone">Phone Number</Label>
              <Input
                id="contact_phone"
                type="tel"
                placeholder="+678 xxxxxxx"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="contact_email">Email</Label>
              <Input
                id="contact_email"
                type="email"
                placeholder="your@email.com"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="contact_whatsapp">WhatsApp Number</Label>
              <Input
                id="contact_whatsapp"
                type="tel"
                placeholder="+678 xxxxxxx"
                value={formData.contact_whatsapp}
                onChange={(e) => setFormData({ ...formData, contact_whatsapp: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show_contact">Show phone number publicly</Label>
              <Switch
                id="show_contact"
                checked={formData.show_contact}
                onCheckedChange={(checked) => setFormData({ ...formData, show_contact: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full h-12 bg-emerald-600 hover:bg-emerald-700"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Posting...
            </>
          ) : (
            'List Property'
          )}
        </Button>
      </form>
    </div>
  );
}
