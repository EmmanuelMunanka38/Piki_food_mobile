import { router } from 'expo-router';
import { usePromotions } from '@/hooks/use-restaurants';
import { DealCardSkeleton } from '@/components/ui/SkeletonLoader';
import DealCard from '@/components/DealCard';

interface DealsSectionProps {
  onOrderPress?: () => void;
}

export default function DealsSection({ onOrderPress = () => router.push('/search') }: DealsSectionProps) {
  const { data: promotions, isPending } = usePromotions();

  if (isPending) {
    return <DealCardSkeleton />;
  }

  return <DealCard promotion={promotions?.[0]} onOrderPress={onOrderPress} />;
}
