import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Check, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Language } from '@/types/profile';

const languages = [
  {
    code: 'en' as Language,
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
  },
  {
    code: 'bi' as Language,
    name: 'Bislama',
    nativeName: 'Bislama',
    flag: '🇻🇺',
  },
  {
    code: 'fr' as Language,
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
  },
];

export default function LanguageSelector() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchLanguagePreference();
    }
  }, [user]);

  const fetchLanguagePreference = async () => {
    try {
      const { data, error } = await supabase
        .from('language_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (!error && data) {
        setSelectedLanguage(data.language as Language);
      }
    } catch (error) {
      console.error('Error fetching language preference:', error);
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('language_preferences').upsert({
        user_id: user!.id,
        language: selectedLanguage,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success('Language preference updated');
      navigate('/profile');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update language');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container py-6 space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Language</h1>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex gap-3 mb-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Choose Your Language</h3>
                <p className="text-sm text-muted-foreground">
                  Select your preferred language for the app interface
                </p>
              </div>
            </div>

            <RadioGroup value={selectedLanguage} onValueChange={(v) => setSelectedLanguage(v as Language)}>
              <div className="space-y-3">
                {languages.map((lang) => (
                  <div
                    key={lang.code}
                    className={`flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedLanguage === lang.code
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedLanguage(lang.code)}
                  >
                    <RadioGroupItem value={lang.code} id={lang.code} />
                    <Label htmlFor={lang.code} className="flex-1 cursor-pointer flex items-center gap-3">
                      <span className="text-3xl">{lang.flag}</span>
                      <div>
                        <p className="font-medium">{lang.name}</p>
                        <p className="text-sm text-muted-foreground">{lang.nativeName}</p>
                      </div>
                    </Label>
                    {selectedLanguage === lang.code && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card className="p-4 bg-muted/30">
          <p className="text-sm text-muted-foreground">
            The app is currently available in English. Bislama and French translations are being prepared.
          </p>
        </Card>

        <Button className="w-full" size="lg" onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Language'}
        </Button>
      </div>
    </Layout>
  );
}
