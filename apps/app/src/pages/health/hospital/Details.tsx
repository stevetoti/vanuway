import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, MapPin, Star, Clock, Hospital, Shield, Phone, Globe,
  Siren, Pill, TestTube, Stethoscope, Calendar, MessageCircle, Loader2
} from 'lucide-react';
import { Hospital as HospitalType, HospitalDepartment, Doctor, HOSPITAL_TYPES } from '@/types/health';

export default function HospitalDetails() {
  const { hospitalId } = useParams();
  const navigate = useNavigate();

  const { data: hospital, isLoading } = useQuery({
    queryKey: ['hospital', hospitalId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('hospitals')
        .select('*')
        .eq('id', hospitalId)
        .single();
      if (error) throw error;
      return data as HospitalType;
    },
  });

  const { data: departments } = useQuery({
    queryKey: ['hospital-departments', hospitalId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('hospital_departments')
        .select('*')
        .eq('hospital_id', hospitalId)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as HospitalDepartment[];
    },
    enabled: !!hospitalId,
  });

  const { data: doctors } = useQuery({
    queryKey: ['hospital-doctors', hospitalId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('doctors')
        .select('*, department:hospital_departments(*)')
        .eq('hospital_id', hospitalId)
        .eq('is_active', true)
        .order('last_name');
      if (error) throw error;
      return data as Doctor[];
    },
    enabled: !!hospitalId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center">
          <Hospital className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h2 className="text-xl font-semibold mb-2">Hospital Not Found</h2>
          <Button onClick={() => navigate('/health/hospitals')}>Browse Hospitals</Button>
        </Card>
      </div>
    );
  }

  const typeInfo = HOSPITAL_TYPES[hospital.type as keyof typeof HOSPITAL_TYPES];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="px-4 pt-4 pb-6">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 mb-4" onClick={() => navigate('/health/hospitals')}>
            <ArrowLeft className="h-6 w-6" />
          </Button>

          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-lg bg-white/20 flex items-center justify-center overflow-hidden">
              {hospital.logo_url ? (
                <img src={hospital.logo_url} alt={hospital.name} className="w-full h-full object-cover" />
              ) : (
                <Hospital className="h-10 w-10 text-white" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold">{hospital.name}</h1>
                {hospital.verified && <Shield className="h-5 w-5" />}
              </div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {typeInfo?.icon} {typeInfo?.label}
                </Badge>
                {hospital.has_emergency && (
                  <Badge className="bg-red-500">
                    <Siren className="h-3 w-3 mr-1" />
                    24/7 Emergency
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400" />
                  {hospital.rating.toFixed(1)}
                </span>
                <span className="flex items-center gap-1 text-blue-100">
                  <MapPin className="h-3 w-3" />
                  {hospital.area || hospital.island}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Buttons */}
          <div className="flex gap-2 mt-4">
            {hospital.phone && (
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => window.open(`tel:${hospital.phone}`, '_blank')}>
                <Phone className="h-4 w-4 mr-1" />
                Call
              </Button>
            )}
            {hospital.emergency_phone && (
              <Button size="sm" className="flex-1 bg-red-500 hover:bg-red-600" onClick={() => window.open(`tel:${hospital.emergency_phone}`, '_blank')}>
                <Siren className="h-4 w-4 mr-1" />
                Emergency
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="px-4 py-3 bg-white border-b flex items-center gap-3 overflow-x-auto">
        {hospital.has_pharmacy && (
          <Badge variant="outline"><Pill className="h-3 w-3 mr-1" />Pharmacy</Badge>
        )}
        {hospital.has_lab && (
          <Badge variant="outline"><TestTube className="h-3 w-3 mr-1" />Lab</Badge>
        )}
        {hospital.has_ambulance && (
          <Badge variant="outline"><Siren className="h-3 w-3 mr-1" />Ambulance</Badge>
        )}
        {hospital.accepts_insurance && (
          <Badge variant="outline">Insurance Accepted</Badge>
        )}
        <Badge variant="outline">
          <Clock className="h-3 w-3 mr-1" />
          {hospital.is_24_hours ? '24 Hours' : `${hospital.opening_time} - ${hospital.closing_time}`}
        </Badge>
      </div>

      {/* Content Tabs */}
      <div className="p-4">
        <Tabs defaultValue="about">
          <TabsList className="w-full">
            <TabsTrigger value="about" className="flex-1">About</TabsTrigger>
            <TabsTrigger value="departments" className="flex-1">Departments</TabsTrigger>
            <TabsTrigger value="doctors" className="flex-1">Doctors</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-4 space-y-4">
            {hospital.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{hospital.description}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Location & Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {hospital.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <span>{hospital.address}, {hospital.area}, {hospital.island}</span>
                  </div>
                )}
                {hospital.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${hospital.phone}`} className="text-blue-600">{hospital.phone}</a>
                  </div>
                )}
                {hospital.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a href={hospital.website} target="_blank" rel="noopener noreferrer" className="text-blue-600">{hospital.website}</a>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments" className="mt-4 space-y-3">
            {departments && departments.length > 0 ? (
              departments.map((dept) => (
                <Card key={dept.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{dept.icon} {dept.name}</h3>
                        {dept.description && <p className="text-sm text-muted-foreground mt-1">{dept.description}</p>}
                      </div>
                      {dept.consultation_fee && (
                        <Badge variant="outline">{dept.consultation_fee.toLocaleString()} VUV</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No departments listed</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="doctors" className="mt-4 space-y-3">
            {doctors && doctors.length > 0 ? (
              doctors.map((doctor) => (
                <Card key={doctor.id} className="cursor-pointer hover:shadow-md" onClick={() => navigate(`/health/hospital/book/${hospitalId}?doctor=${doctor.id}`)}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                        {doctor.photo_url ? (
                          <img src={doctor.photo_url} alt={doctor.first_name} className="w-full h-full object-cover" />
                        ) : (
                          <Stethoscope className="h-6 w-6 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{doctor.title} {doctor.first_name} {doctor.last_name}</h3>
                        <p className="text-sm text-blue-600">{doctor.specialization}</p>
                        {doctor.department && (
                          <p className="text-xs text-muted-foreground">{doctor.department.name}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {doctor.experience_years && (
                            <Badge variant="secondary" className="text-xs">{doctor.experience_years}+ yrs exp</Badge>
                          )}
                          {doctor.consultation_fee && (
                            <Badge variant="outline" className="text-xs">{doctor.consultation_fee.toLocaleString()} VUV</Badge>
                          )}
                        </div>
                      </div>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Calendar className="h-4 w-4 mr-1" />
                        Book
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center">
                <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-muted-foreground">No doctors listed</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Book Appointment Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <Button
          className="w-full h-12 bg-blue-600 hover:bg-blue-700"
          onClick={() => navigate(`/health/hospital/book/${hospitalId}`)}
        >
          <Calendar className="h-5 w-5 mr-2" />
          Book Appointment
        </Button>
      </div>
    </div>
  );
}
