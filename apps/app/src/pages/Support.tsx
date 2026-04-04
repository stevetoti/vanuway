import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft,
  MessageCircle,
  Mail,
  Phone,
  HelpCircle,
  ChevronRight,
  Send,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';

export default function Support() {
  const navigate = useNavigate();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const faqCategories = [
    {
      title: 'Rides',
      icon: '🚗',
      questions: [
        'How do I book a ride?',
        'Can I schedule a ride in advance?',
        'How do I cancel a booking?',
        'What are the payment options?',
      ],
    },
    {
      title: 'Food Delivery',
      icon: '🍕',
      questions: [
        'How long does delivery take?',
        'Can I track my order?',
        'What if my order is wrong?',
        'How do I contact the restaurant?',
      ],
    },
    {
      title: 'Wallet & Payments',
      icon: '💳',
      questions: [
        'How do I add money to my wallet?',
        'Is my payment information secure?',
        'How do I get a refund?',
        'What payment methods are supported?',
      ],
    },
    {
      title: 'Account',
      icon: '👤',
      questions: [
        'How do I update my profile?',
        'How do I change my password?',
        'Can I delete my account?',
        'How do I verify my phone number?',
      ],
    },
  ];

  const contactMethods = [
    {
      icon: MessageCircle,
      title: 'WhatsApp Support',
      subtitle: '+678 XXXX XXXX',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      action: 'Chat Now',
    },
    {
      icon: Phone,
      title: 'Phone Support',
      subtitle: '+678 XXXX XXXX',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      action: 'Call Now',
    },
    {
      icon: Mail,
      title: 'Email Support',
      subtitle: 'support@vanuway.com',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      action: 'Send Email',
    },
  ];

  const handleSubmit = async () => {
    if (!category || !subject || !message) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // In production, this would send to support system
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success('Support request submitted successfully');
      setCategory('');
      setSubject('');
      setMessage('');
    } catch (error) {
      toast.error('Failed to submit request');
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
          <h1 className="text-3xl font-bold">Help & Support</h1>
        </div>

        {/* Contact Methods */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {contactMethods.map((method) => (
            <Card key={method.title} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className={`h-14 w-14 mx-auto rounded-full ${method.bgColor} flex items-center justify-center mb-3`}>
                  <method.icon className={`h-7 w-7 ${method.color}`} />
                </div>
                <h3 className="font-semibold mb-1">{method.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{method.subtitle}</p>
                <Button variant="outline" size="sm" className="w-full">
                  {method.action}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Submit Request Form */}
        <Card>
          <CardHeader>
            <CardTitle>Submit a Support Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rides">Rides</SelectItem>
                  <SelectItem value="food">Food Delivery</SelectItem>
                  <SelectItem value="wallet">Wallet & Payments</SelectItem>
                  <SelectItem value="account">Account Issues</SelectItem>
                  <SelectItem value="technical">Technical Problem</SelectItem>
                  <SelectItem value="feedback">Feedback</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief description of your issue"
                className="mt-2"
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Provide detailed information about your issue..."
                rows={5}
                className="mt-2"
              />
            </div>
            <Button className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </CardContent>
        </Card>

        {/* FAQ Categories */}
        <div>
          <h2 className="text-xl font-bold mb-4">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqCategories.map((cat) => (
              <Card key={cat.title} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{cat.icon}</span>
                    <h3 className="font-semibold">{cat.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {cat.questions.map((q, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 flex-shrink-0" />
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>More Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: 'Safety Guidelines', path: '/safety' },
              { label: 'Community Guidelines', path: '/community' },
              { label: 'Driver/Partner Support', path: '/partner-support' },
            ].map((link) => (
              <div
                key={link.path}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => toast.info('Coming soon')}
              >
                <span className="font-medium">{link.label}</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
