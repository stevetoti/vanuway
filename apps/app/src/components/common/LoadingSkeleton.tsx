import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const CardSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2 mt-2" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-5/6" />
    </CardContent>
  </Card>
);

export const RestaurantCardSkeleton = () => (
  <Card>
    <Skeleton className="h-40 w-full rounded-t-lg" />
    <CardContent className="p-4">
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-3" />
      <div className="flex gap-2 mb-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-4 w-full" />
    </CardContent>
  </Card>
);

export const MenuItemSkeleton = () => (
  <div className="flex gap-4 p-3 border rounded-lg">
    <Skeleton className="h-20 w-20 rounded-lg flex-shrink-0" />
    <div className="flex-1">
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-1/2" />
    </div>
    <Skeleton className="h-6 w-16" />
  </div>
);

export const OrderCardSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex justify-between items-center pt-2 border-t">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-20" />
      </div>
    </CardContent>
  </Card>
);

export const TransactionSkeleton = () => (
  <div className="flex items-center gap-3 p-3 rounded-lg border">
    <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
    <div className="flex-1">
      <Skeleton className="h-5 w-1/2 mb-2" />
      <Skeleton className="h-4 w-1/3" />
    </div>
    <div className="text-right">
      <Skeleton className="h-5 w-20 mb-1" />
      <Skeleton className="h-4 w-16" />
    </div>
  </div>
);

export const ProfileSkeleton = () => (
  <div className="space-y-6">
    <Card className="p-6">
      <div className="flex gap-4">
        <Skeleton className="h-20 w-20 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </div>
    </Card>
    <div className="grid grid-cols-3 gap-4">
      <Card className="p-4">
        <Skeleton className="h-10 w-10 mx-auto mb-2 rounded-full" />
        <Skeleton className="h-6 w-12 mx-auto mb-1" />
        <Skeleton className="h-4 w-16 mx-auto" />
      </Card>
      <Card className="p-4">
        <Skeleton className="h-10 w-10 mx-auto mb-2 rounded-full" />
        <Skeleton className="h-6 w-12 mx-auto mb-1" />
        <Skeleton className="h-4 w-16 mx-auto" />
      </Card>
      <Card className="p-4">
        <Skeleton className="h-10 w-10 mx-auto mb-2 rounded-full" />
        <Skeleton className="h-6 w-12 mx-auto mb-1" />
        <Skeleton className="h-4 w-16 mx-auto" />
      </Card>
    </div>
  </div>
);

export const PageSkeleton = () => (
  <div className="container py-6 space-y-6 max-w-4xl">
    <Skeleton className="h-10 w-48" />
    <div className="space-y-4">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  </div>
);
