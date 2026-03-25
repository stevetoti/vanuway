import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DocumentUploadData } from '@/types/driver-onboarding';
import { ArrowLeft, ArrowRight, Upload, Check, X } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface DocumentUploadStepProps {
  initialData?: DocumentUploadData;
  onNext: (data: DocumentUploadData) => void;
  onBack: () => void;
}

export const DocumentUploadStep = ({
  initialData,
  onNext,
  onBack,
}: DocumentUploadStepProps) => {
  const [formData, setFormData] = useState<DocumentUploadData>(
    initialData || {
      license_front: null,
      license_back: null,
      national_id_front: null,
      vehicle_registration: null,
      vehicle_insurance: null,
      profile_photo: null,
    }
  );

  const handleFileChange = (
    field: keyof DocumentUploadData,
    file: File | null
  ) => {
    setFormData({ ...formData, [field]: file });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  const documents = [
    {
      key: 'license_front' as keyof DocumentUploadData,
      label: 'Driver License (Front)',
      required: true,
      description: 'Clear photo of the front of your driver license',
    },
    {
      key: 'license_back' as keyof DocumentUploadData,
      label: 'Driver License (Back)',
      required: true,
      description: 'Clear photo of the back of your driver license',
    },
    {
      key: 'national_id_front' as keyof DocumentUploadData,
      label: 'National ID / Passport',
      required: true,
      description: 'Government-issued ID for verification',
    },
    {
      key: 'vehicle_registration' as keyof DocumentUploadData,
      label: 'Vehicle Registration',
      required: true,
      description: 'Current vehicle registration document',
    },
    {
      key: 'vehicle_insurance' as keyof DocumentUploadData,
      label: 'Insurance Certificate',
      required: true,
      description: 'Valid vehicle insurance certificate',
    },
    {
      key: 'profile_photo' as keyof DocumentUploadData,
      label: 'Profile Photo',
      required: false,
      description: 'Professional photo for your driver profile',
    },
  ];

  const requiredDocsUploaded = documents
    .filter((doc) => doc.required)
    .every((doc) => formData[doc.key]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Upload Documents</h2>
        <p className="text-muted-foreground">
          Upload clear photos of your documents for verification
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Document Guidelines</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Photos should be clear and readable</li>
          <li>• All text must be visible (no blurry images)</li>
          <li>• Supported formats: JPG, PNG, PDF (max 10MB each)</li>
          <li>• Documents must be current and not expired</li>
        </ul>
      </div>

      <div className="space-y-4">
        {documents.map((doc) => (
          <Card key={doc.key} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Label htmlFor={doc.key} className="text-base font-semibold">
                    {doc.label}
                  </Label>
                  {doc.required && (
                    <span className="text-xs text-destructive">*Required</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {doc.description}
                </p>

                {formData[doc.key] ? (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Check className="h-4 w-4" />
                    <span>{(formData[doc.key] as File).name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFileChange(doc.key, null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id={doc.key}
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        if (file && file.size > 10 * 1024 * 1024) {
                          alert('File size must be less than 10MB');
                          return;
                        }
                        handleFileChange(doc.key, file);
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById(doc.key)?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="bg-muted/50 p-4 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> Your documents will be reviewed by our team
          within 24-48 hours. You'll be notified once your application is
          approved.
        </p>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button type="submit" className="flex-1" disabled={!requiredDocsUploaded}>
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {!requiredDocsUploaded && (
        <p className="text-sm text-center text-destructive">
          Please upload all required documents to continue
        </p>
      )}
    </form>
  );
};
