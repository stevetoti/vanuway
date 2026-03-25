import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Terms() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="container py-6 space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Terms & Conditions</h1>
          </div>
        </div>

        <Card>
          <CardContent className="p-6 md:p-8 space-y-6 prose prose-sm max-w-none">
            <p className="text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <section>
              <h2 className="text-xl font-bold mb-3">1. Introduction</h2>
              <p className="text-muted-foreground">
                Welcome to VanuWay ("we," "our," or "us"). These Terms and Conditions govern your use of the VanuWay mobile application and services. By accessing or using our services, you agree to be bound by these terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">2. Services</h2>
              <p className="text-muted-foreground mb-3">
                VanuWay provides a platform connecting users with:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Transportation services (ride-hailing)</li>
                <li>Food delivery services</li>
                <li>Digital wallet and payment services</li>
                <li>Other on-demand services as may be offered</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">3. User Accounts</h2>
              <p className="text-muted-foreground mb-3">
                To use our services, you must:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Be at least 18 years old</li>
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized use</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">4. Payments and Fees</h2>
              <p className="text-muted-foreground mb-3">
                Payment terms:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>All prices are displayed in Vanuatu Vatu (VUV) unless otherwise stated</li>
                <li>Payment methods include My Cash, M-Vatu, credit/debit cards, and VanuWay Wallet</li>
                <li>Service fees and charges will be clearly displayed before booking confirmation</li>
                <li>Cancellation fees may apply as per our cancellation policy</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">5. User Conduct</h2>
              <p className="text-muted-foreground mb-3">
                You agree not to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Violate any local, national, or international laws</li>
                <li>Harass, abuse, or harm drivers, delivery partners, or other users</li>
                <li>Use the service for fraudulent or illegal activities</li>
                <li>Attempt to manipulate prices or game the system</li>
                <li>Reverse engineer or tamper with the application</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">6. Cancellations and Refunds</h2>
              <p className="text-muted-foreground">
                Cancellation policies vary by service type. Refunds for cancelled bookings will be processed according to our refund policy, typically within 5-7 business days to your original payment method or VanuWay Wallet.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">7. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                VanuWay acts as a platform connecting users with service providers. We are not liable for the actions of drivers, restaurants, or delivery partners. Our liability is limited to the maximum extent permitted by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">8. Intellectual Property</h2>
              <p className="text-muted-foreground">
                All content, trademarks, and intellectual property on the VanuWay platform are owned by or licensed to VanuWay. You may not use, copy, or distribute any content without our express written permission.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">9. Modifications</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify these terms at any time. We will notify users of significant changes via email or in-app notification. Continued use of the service after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">10. Governing Law</h2>
              <p className="text-muted-foreground">
                These terms are governed by the laws of the Republic of Vanuatu. Any disputes will be resolved in the courts of Port Vila, Vanuatu.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">11. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have questions about these Terms and Conditions, please contact us at:
              </p>
              <div className="bg-muted p-4 rounded-lg mt-3">
                <p className="font-medium">VanuWay Support</p>
                <p className="text-sm text-muted-foreground">Email: legal@vanuway.vu</p>
                <p className="text-sm text-muted-foreground">Phone: +678 XXXX XXXX</p>
                <p className="text-sm text-muted-foreground">Address: Port Vila, Vanuatu</p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
