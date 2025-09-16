'use client';

import { PageLayout } from '@/components/page-layout';
import { CalendarMain } from '@/components/calendar/calendar-main';

export default function CalendarPage() {
  return (
    <PageLayout>
      <div className="mt-4">
        <CalendarMain />
      </div>
    </PageLayout>
  );
}
