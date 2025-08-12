import { LoadingSpinner } from '@/components/loading-spinner';
import { PageLayout, PageHeader, PageContent } from '@/components/page-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

export default function NoticeBoardLoading() {
  return (
    <PageLayout>
      <Loader2 className="animate-spin text-white" />
    </PageLayout>
  );
}