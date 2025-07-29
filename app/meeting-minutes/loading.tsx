import { LoadingSpinner } from '@/components/loading-spinner';

export default function MeetingMinutesLoading() {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <LoadingSpinner className="mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Loading meeting minutes...</p>
      </div>
    </div>
  );
}