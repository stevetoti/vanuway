import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Notifications = () => {
  return (
    <Layout>
      <div className="container py-6 space-y-6">
        <h1 className="text-2xl font-bold">Notifications</h1>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="rides">Rides</TabsTrigger>
            <TabsTrigger value="food">Food</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No notifications yet</p>
            </Card>
          </TabsContent>
          
          <TabsContent value="rides" className="mt-6">
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No ride notifications</p>
            </Card>
          </TabsContent>
          
          <TabsContent value="food" className="mt-6">
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No food notifications</p>
            </Card>
          </TabsContent>
          
          <TabsContent value="system" className="mt-6">
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No system notifications</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Notifications;
