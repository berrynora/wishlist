import { useQuery } from '@tanstack/react-query';
import { getMyStatistics } from '@/api/user';
import { supabaseBrowser } from '@/lib/supabase-browser';

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

const authKeys = {
  user: ['auth', 'user'] as const,
};

// Fetches current user once and caches via React Query to avoid repeated Supabase calls
export function useCurrentUserId() {
  return useQuery({
    queryKey: authKeys.user,
    queryFn: async () => {
      const { data, error } = await supabaseBrowser.auth.getUser();
      if (error) throw error;
      return data.user?.id ?? '';
    },
  });
}