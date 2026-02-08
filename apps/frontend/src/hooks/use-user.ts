import { useQuery } from '@tanstack/react-query';
import { getMyStatistics } from '@/api/user';

export const statisticsKeys = {
  all: ['statistics'] as const,
  my: () => [...statisticsKeys.all, 'my'] as const,
};

export function useMyStatistics() {
  return useQuery({
    queryKey: statisticsKeys.my(),
    queryFn: () => getMyStatistics(),
  });
}