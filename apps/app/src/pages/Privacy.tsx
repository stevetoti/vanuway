import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="container py-6 space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
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
                VanuWay ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">2. Information We Collect</h2>

              <h3 className="text-lg font-semibold mb-2 mt-4">Personal Information</h3>
              <p className="text-muted-foreground mb-3">
                We collect information that you provide directly to us:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Name, email address, phone number</li>
                <li>Profile photo (optional)</li>
                <li>Payment information (processed securely by our payment partners)</li>
                <li>Delivery addresses</li>
              </ul>

              <h3 className="text-lg font-semibold mb-2 mt-4">Location Data</h3>
              <p className="text-muted-foreground">
                We collect precise location data when you use our ride-hailing or delivery services. This is essential for connecting you with nearby drivers and tracking your orders.
              </p>

              <h3 className="text-lg font-semibold mb-2 mt-4">Usage Information</h3>
              <p className="text-muted-foreground mb-3">
                We automatically collect:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Device information (model, OS version, unique identifiers)</li>
                <li>Log data (IP address, browser type, access times)</li>
                <li>App usage data (features used, time spent)</li>
                <li>Transaction history</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">3. How We Use Your Information</h2>
              <p className="text-muted-foreground mb-3">
                We use your information to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Provide and maintain our services</li>
                <li>Process your bookings and payments</li>
                <li>Connect you with drivers and delivery partners</li>
                <li>Send booking confirmations and updates</li>
                <li>Provide customer support</li>
                <li>Improve our services and develop new features</li>
                <li>Send promotional offers (with your consent)</li>
                <li>Ensure safety and prevent fraud</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">4. Information Sharing</h2>
              <p className="text-muted-foreground mb-3">
                We may share your information with:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Service Providers:</strong> Drivers, restaurants, delivery partners (only necessary information)</li>
                <li><strong>Payment Processors:</strong> My Cash, M-Vatu, card payment partners (for transaction processing)</li>
                <li><strong>Business Partners:</strong> For analytics and service improvements</li>
                <li><strong>Legal Authorities:</strong> When required by law or to protect rights and safety</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                We do not sell your personal information to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">5. Data Security</h2>
              <p className="text-muted-foreground">
                We implement industry-standard security measures to protect your information, including:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure payment processing through certified partners</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">6. Your Rights</h2>
              <p className="text-muted-foreground mb-3">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to data processing</li>
                <li>Opt-out of promotional communications</li>
                <li>Withdraw consent (where processing is based on consent)</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                To exercise these rights, contact us at privacy@vanuway.vu
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">7. Data Retention</h2>
              <p className="text-muted-foreground">
                We retain your information for as long as necessary to provide our services and comply with legal obligations. Inactive accounts may be deleted after 3 years of inactivity.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">8. Children's Privacy</h2>
              <p className="text-muted-foreground">
                Our services are not intended for users under 18 years of age. We do not knowingly collect information from children.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">9. International Data Transfers</h2>
              <p className="text-muted-foreground">
                Your information may be transferred to and processed in countries other than Vanuatu. We ensure appropriate safeguards are in place for such transfers.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">10. Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of significant changes via email or in-app notification.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">11. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have questions about this Privacy Policy, please contact us at:
              </p>
              <div className="bg-muted p-4 rounded-lg mt-3">
                <p className="font-medium">VanuWay Privacy Team</p>
                <p className="text-sm text-muted-foreground">Email: privacy@vanuway.vu</p>
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
