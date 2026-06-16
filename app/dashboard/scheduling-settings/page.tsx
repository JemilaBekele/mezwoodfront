import React from 'react';
import { Gauge, CalendarOff } from 'lucide-react';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import SchedulingSettingsForm from '@/features/SchedulingSettings/form';
import HolidayManager from '@/features/SchedulingSettings/holidays';

export const metadata = {
  title: 'Dashboard: Scheduling Settings'
};

function Section({
  icon,
  title,
  subtitle,
  children
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className='rounded-xl border border-border bg-card shadow-sm'>
      <header className='flex items-start gap-3 border-b border-border px-5 py-4'>
        <span className='grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary'>
          {icon}
        </span>
        <div className='min-w-0'>
          <h2 className='text-sm font-semibold'>{title}</h2>
          <p className='text-xs text-muted-foreground'>{subtitle}</p>
        </div>
      </header>
      <div className='p-5'>{children}</div>
    </section>
  );
}

export default function SchedulingSettingsPage() {
  return (
    <PageContainer scrollable>
      <div className='flex flex-1 flex-col space-y-5 pb-8'>
        <Heading
          title='Scheduling Settings'
          description='Tune the delivery formula and the workshop calendar — changes apply to new estimates and projects immediately.'
        />
        <Separator />
        <div className='grid grid-cols-1 items-start gap-5 xl:grid-cols-2'>
          <Section
            icon={<Gauge className='h-4 w-4' />}
            title='Delivery formula'
            subtitle='Contingency buffer, difficulty allowance and working hours per day.'
          >
            <SchedulingSettingsForm />
          </Section>
          <Section
            icon={<CalendarOff className='h-4 w-4' />}
            title='Holidays & non-working days'
            subtitle='Dates the workshop is closed — the scheduler plans around them.'
          >
            <HolidayManager />
          </Section>
        </div>
      </div>
    </PageContainer>
  );
}
