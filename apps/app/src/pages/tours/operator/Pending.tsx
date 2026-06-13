import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Clock, CheckCircle, XCircle, ArrowLeft, Phone, Mail } from 'lucide-react';

export default function OperatorPending() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [operator, setOperator] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkOperatorStatus();
    }
  }, [user]);

  const checkOperatorStatus = async () => {
    if (!user) return;

    const { data, error } = await (supabase as unknown)
      .from('tour_operators')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      navigate('/tours/operator/register');
      return;
    }

    if (data.application_status === 'approved') {
      navigate('/tours/operator/dashboard');
      return;
    }

    setOperator(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  const getStatusContent = () => {
    switch (operator?.application_status) {
      case 'submitted':
      case 'under_review':
        return {
          icon: Clock,
          iconColor: 'text-amber-500',
          bgColor: 'bg-amber-50',
          title: 'Application Under Review',
          message: 'Your tour operator application is being reviewed by our team. This usually takes 2-3 business days.',
        };
      case 'rejected':
        return {
          icon: XCircle,
          iconColor: 'text-red-500',
          bgColor: 'bg-red-50',
          title: 'Application Not Approved',
          message: operator.rejection_reason || 'Unfortunately, your application was not approved. Please contact us for more information.',
        };
      case 'suspended':
        return {
          icon: XCircle,
          iconColor: 'text-red-500',
          bgColor: 'bg-red-50',
          title: 'Account Suspended',
          message: 'Your tour operator account has been suspended. Please contact support for assistance.',
        };
      default:
        return {
          icon: Clock,
          iconColor: 'text-blue-500',
          bgColor: 'bg-blue-50',
          title: 'Application Pending',
          message: 'Your application is pending. Please complete all required steps.',
        };
    }
  };

  const content = getStatusContent();
  const Icon = content.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white px-4 py-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => navigate('/tours')}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Application Status</h1>
            <p className="text-sm text-white/80">{operator?.business_name}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-8 max-w-md mx-auto">
        <Card className={content.bgColor}>
          <CardContent className="p-8 text-center">
            <Icon className={`h-20 w-20 mx-auto ${content.iconColor} mb-6`} />
            <h2 className="text-2xl font-bold mb-3">{content.title}</h2>
            <p className="text-muted-foreground mb-6">{content.message}</p>

            {operator?.application_status === 'rejected' && (
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 mb-4"
                onClick={() => navigate('/tours/operator/register')}
              >
                Reapply
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Application Details */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Application Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Business Name</span>
                <span className="font-medium">{operator?.business_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contact Person</span>
                <span className="font-medium">{operator?.contact_person}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{operator?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Island</span>
                <span className="font-medium">{operator?.island}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Submitted</span>
                <span className="font-medium">
                  {new Date(operator?.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Need Help?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              If you have any questions about your application, please contact us.
            </p>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                support@vanuway.com
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Phone className="h-4 w-4 mr-2" />
                +678 12345
              </Button>
            </div>
          </CardContent>
        </Card>

        <Button
          variant="outline"
          className="w-full mt-6"
          onClick={() => navigate('/tours')}
        >
          Browse Tours
        </Button>
      </div>
    </div>
  );
}
