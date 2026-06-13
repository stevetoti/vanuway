import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
  Wallet as WalletIcon,
  Smartphone,
  CreditCard,
  Calendar,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Transaction, Currency, PaymentMethod, TransactionType, TransactionCategory } from '@/types/wallet';

const Wallet = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('VUV');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Money Modal
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [addMoneyAmount, setAddMoneyAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('my_cash');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Transaction Details Modal
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | TransactionCategory>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWalletData();
      setupRealtimeSubscription();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [transactions, filterType, filterCategory]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);

      // Fetch wallet balance
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (walletError && walletError.code !== 'PGRST116') {
        // Create wallet if doesn't exist
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert({
            user_id: user!.id,
            balance_vvu: 0,
            balance_aud: 0,
            balance_usd: 0,
          })
          .select()
          .single();

        if (!createError && newWallet) {
          setBalance(newWallet.balance_vvu);
        }
      } else if (walletData) {
        setBalance(
          selectedCurrency === 'VUV'
            ? walletData.balance_vvu
            : selectedCurrency === 'AUD'
            ? walletData.balance_aud
            : walletData.balance_usd
        );
      }

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!transactionsError && transactionsData) {
        setTransactions(transactionsData as Transaction[]);
      }
    } catch (error: unknown) {
      console.error('Error fetching wallet data:', error);
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('wallet_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${user!.id}`,
        },
        (payload) => {
          const newData = payload.new as unknown;
          if (newData) {
            setBalance(
              selectedCurrency === 'VUV'
                ? newData.balance_vvu
                : selectedCurrency === 'AUD'
                ? newData.balance_aud
                : newData.balance_usd
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user!.id}`,
        },
        () => {
          fetchWalletData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    if (filterType !== 'all') {
      filtered = filtered.filter((t) => t.type === filterType);
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter((t) => t.category === filterCategory);
    }

    setFilteredTransactions(filtered);
  };

  const handleAddMoney = async () => {
    const amount = parseFloat(addMoneyAmount);

    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if ((paymentMethod === 'my_cash' || paymentMethod === 'm_vatu') && !phoneNumber) {
      toast.error('Please enter your mobile number');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create pending transaction
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert([{
          user_id: user!.id,
          type: 'credit',
          category: 'top_up',
          amount: amount,
          currency: selectedCurrency,
          description: `Top up via ${getPaymentMethodLabel(paymentMethod)}`,
          payment_method: paymentMethod,
          status: 'pending',
          balance_after: balance + amount,
          metadata: {
            phone_number: phoneNumber || null,
          },
        }])
        .select()
        .single();

      if (txError) throw txError;

      // Here you would integrate with actual payment gateways
      // For now, we'll simulate the payment process
      toast.success('Payment request initiated');
      toast.info(
        `Please complete the payment on your ${getPaymentMethodLabel(paymentMethod)} device`,
        { duration: 5000 }
      );

      // Reset form
      setAddMoneyAmount('');
      setPhoneNumber('');
      setShowAddMoneyModal(false);

      // In production, payment gateway webhooks would update the transaction status
      // and wallet balance. For demo, we'll auto-complete after 3 seconds
      setTimeout(async () => {
        await supabase
          .from('transactions')
          .update({ status: 'completed' })
          .eq('id', transaction.id);

        const balanceField = `balance_${selectedCurrency.toLowerCase()}`;
        const { data: wallet } = await supabase
          .from('wallets')
          .select(balanceField)
          .eq('user_id', user!.id)
          .single();

        if (wallet) {
          await supabase
            .from('wallets')
            .update({ [balanceField]: wallet[balanceField] + amount })
            .eq('user_id', user!.id);
        }

        toast.success('Payment completed! Your wallet has been credited');
        fetchWalletData();
      }, 3000);
    } catch (error: unknown) {
      toast.error(error.message || 'Failed to process payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPaymentMethodLabel = (method: PaymentMethod): string => {
    const labels: Record<PaymentMethod, string> = {
      my_cash: 'My Cash (Digicel)',
      m_vatu: 'M-Vatu (Vodafone)',
      polar: 'Credit/Debit Card',
      wallet: 'VanuWay Wallet',
      cash: 'Cash',
    };
    return labels[method];
  };

  const getTransactionIcon = (transaction: Transaction) => {
    return transaction.type === 'credit' ? (
      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
        <ArrowDownLeft className="h-5 w-5 text-green-600" />
      </div>
    ) : (
      <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
        <ArrowUpRight className="h-5 w-5 text-red-600" />
      </div>
    );
  };

  const getCategoryLabel = (category: TransactionCategory): string => {
    const labels: Record<TransactionCategory, string> = {
      top_up: 'Top Up',
      ride_payment: 'Ride Payment',
      food_payment: 'Food Payment',
      refund: 'Refund',
      transfer_sent: 'Transfer Sent',
      transfer_received: 'Transfer Received',
      withdrawal: 'Withdrawal',
    };
    return labels[category];
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      completed: { label: 'Completed', className: 'bg-green-500 text-white' },
      pending: { label: 'Pending', className: 'bg-yellow-500 text-white' },
      failed: { label: 'Failed', className: 'bg-red-500 text-white' },
      cancelled: { label: 'Cancelled', className: 'bg-gray-500 text-white' },
    };
    const variant = variants[status] || variants.pending;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <p className="text-muted-foreground">Loading wallet...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6 space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Wallet</h1>
          <Select value={selectedCurrency} onValueChange={(v) => setSelectedCurrency(v as Currency)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="VUV">VUV</SelectItem>
              <SelectItem value="AUD">AUD</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Balance Card */}
        <Card className="overflow-hidden">
          <div className="p-6 bg-gradient-to-br from-primary via-primary/90 to-secondary text-primary-foreground">
            <div className="space-y-2">
              <p className="text-sm opacity-90 flex items-center gap-2">
                <WalletIcon className="h-4 w-4" />
                Available Balance
              </p>
              <p className="text-5xl font-bold">
                {balance.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                <span className="text-2xl">{selectedCurrency}</span>
              </p>
            </div>
            <div className="mt-6 flex gap-3">
              <Button
                className="bg-background text-foreground hover:bg-background/90 flex-1"
                onClick={() => setShowAddMoneyModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Money
              </Button>
              <Button variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                <Download className="h-4 w-4 mr-2" />
                Withdraw
              </Button>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center cursor-pointer hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Send className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-medium">Send Money</p>
          </Card>
          <Card className="p-4 text-center cursor-pointer hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 mx-auto rounded-full bg-secondary/10 flex items-center justify-center mb-2">
              <ArrowDownLeft className="h-6 w-6 text-secondary" />
            </div>
            <p className="text-sm font-medium">Request Money</p>
          </Card>
          <Card className="p-4 text-center cursor-pointer hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-2">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-sm font-medium">Pay Bills</p>
          </Card>
        </div>

        {/* Transactions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Transactions</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            {showFilters && (
              <div className="p-4 border rounded-lg space-y-4 bg-muted/30">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm mb-2">Transaction Type</Label>
                    <Tabs value={filterType} onValueChange={(v) => setFilterType(v as unknown)}>
                      <TabsList className="grid grid-cols-3">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="credit">Credit</TabsTrigger>
                        <TabsTrigger value="debit">Debit</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <div>
                    <Label className="text-sm mb-2">Category</Label>
                    <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as unknown)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="top_up">Top Up</SelectItem>
                        <SelectItem value="ride_payment">Ride Payment</SelectItem>
                        <SelectItem value="food_payment">Food Payment</SelectItem>
                        <SelectItem value="refund">Refund</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Transaction List */}
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <WalletIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No transactions found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedTransaction(transaction);
                      setShowTransactionModal(true);
                    }}
                  >
                    {getTransactionIcon(transaction)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(transaction.created_at), 'MMM dd, yyyy • HH:mm')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {transaction.type === 'credit' ? '+' : '-'}
                        {transaction.amount.toFixed(2)} {transaction.currency}
                      </p>
                      {getStatusBadge(transaction.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Money Modal */}
        <Dialog open={showAddMoneyModal} onOpenChange={setShowAddMoneyModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Money to Wallet</DialogTitle>
              <DialogDescription>
                Choose your payment method and enter the amount
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Amount */}
              <div>
                <Label>Amount ({selectedCurrency})</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={addMoneyAmount}
                  onChange={(e) => setAddMoneyAmount(e.target.value)}
                  className="text-2xl font-semibold h-14 mt-2"
                />
              </div>

              {/* Payment Method */}
              <div>
                <Label className="mb-3 block">Payment Method</Label>
                <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="my_cash" id="my_cash" />
                      <Label htmlFor="my_cash" className="flex-1 cursor-pointer flex items-center gap-3">
                        <Smartphone className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">My Cash</p>
                          <p className="text-sm text-muted-foreground">Digicel Mobile Money</p>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="m_vatu" id="m_vatu" />
                      <Label htmlFor="m_vatu" className="flex-1 cursor-pointer flex items-center gap-3">
                        <Smartphone className="h-5 w-5 text-secondary" />
                        <div>
                          <p className="font-medium">M-Vatu</p>
                          <p className="text-sm text-muted-foreground">Vodafone Mobile Money</p>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="polar" id="polar" />
                      <Label htmlFor="polar" className="flex-1 cursor-pointer flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">Credit/Debit Card</p>
                          <p className="text-sm text-muted-foreground">Visa, Mastercard</p>
                        </div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Phone Number (for mobile money) */}
              {(paymentMethod === 'my_cash' || paymentMethod === 'm_vatu') && (
                <div>
                  <Label>Mobile Number</Label>
                  <Input
                    type="tel"
                    placeholder="+678 XXXXXXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="mt-2"
                  />
                </div>
              )}

              {/* Submit */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAddMoneyModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleAddMoney}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Processing...' : 'Continue'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Transaction Details Modal */}
        <Dialog open={showTransactionModal} onOpenChange={setShowTransactionModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transaction Details</DialogTitle>
            </DialogHeader>
            {selectedTransaction && (
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-center mb-4">
                  {getTransactionIcon(selectedTransaction)}
                </div>

                <div className="text-center mb-6">
                  <p
                    className={`text-4xl font-bold ${
                      selectedTransaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {selectedTransaction.type === 'credit' ? '+' : '-'}
                    {selectedTransaction.amount.toFixed(2)} {selectedTransaction.currency}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {selectedTransaction.description}
                  </p>
                </div>

                <div className="space-y-3 border-t pt-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transaction ID</span>
                    <span className="font-mono text-sm">{selectedTransaction.id.slice(0, 12)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <span>{getCategoryLabel(selectedTransaction.category)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    {getStatusBadge(selectedTransaction.status)}
                  </div>
                  {selectedTransaction.payment_method && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Method</span>
                      <span>{getPaymentMethodLabel(selectedTransaction.payment_method)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date & Time</span>
                    <span>{format(new Date(selectedTransaction.created_at), 'MMM dd, yyyy HH:mm')}</span>
                  </div>
                </div>

                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Receipt
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Wallet;
