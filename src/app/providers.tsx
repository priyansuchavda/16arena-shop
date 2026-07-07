"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/shared/lib/query-client";
import { useFcm } from "@/features/notifications/hooks/useFcm";
import { NotificationToast } from "@/features/notifications/components/NotificationToast";

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  useFcm();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <NotificationToast />
    </QueryClientProvider>
  );
}
