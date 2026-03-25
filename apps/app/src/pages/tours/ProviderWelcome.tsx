import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Plus, LayoutDashboard, BookOpen } from 'lucide-react';

const TourProviderWelcome = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="container py-12 max-w-2xl">
        <Card className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-green-100 rounded-full">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome, Tour Provider!</h1>
            <p className="text-muted-foreground">
              Your application has been submitted successfully. Our team will review your
              information and verify your account within 2-3 business days.
            </p>
          </div>

          <Card className="p-4 bg-yellow-50 border-yellow-200 text-left">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> While your account is pending verification, you can start
              adding tours. They will become visible to customers once your account is verified.
            </p>
          </Card>

          <div className="space-y-4">
            <h3 className="font-semibold">Getting Started</h3>
            
            <div className="grid gap-3">
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto py-4"
                onClick={() => navigate('/tours/provider/add-tour')}
              >
                <Plus className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Add Your First Tour</p>
                  <p className="text-sm text-muted-foreground">Create your first tour listing</p>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start h-auto py-4"
                onClick={() => navigate('/tours/provider/dashboard')}
              >
                <LayoutDashboard className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Go to Dashboard</p>
                  <p className="text-sm text-muted-foreground">Manage your tours and bookings</p>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start h-auto py-4"
                onClick={() => navigate('/tours/provider/bookings')}
              >
                <BookOpen className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">View Bookings</p>
                  <p className="text-sm text-muted-foreground">Manage customer bookings</p>
                </div>
              </Button>
            </div>
          </div>

          <div className="pt-4">
            <Button onClick={() => navigate('/tours/provider/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default TourProviderWelcome;
