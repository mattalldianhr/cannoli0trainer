import { prisma } from '@/lib/prisma';
import { getCurrentCoachId } from '@/lib/coach';
import { Container } from '@/components/layout/Container';
import { SettingsForm } from '@/components/settings/SettingsForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Settings | Cannoli Trainer',
};

export default async function SettingsPage() {
  const coachId = await getCurrentCoachId();

  const coach = await prisma.coach.findUnique({
    where: { id: coachId },
    select: {
      id: true,
      name: true,
      email: true,
      brandName: true,
      defaultWeightUnit: true,
      timezone: true,
      defaultRestTimerSeconds: true,
      notificationPreferences: true,
    },
  });

  if (!coach) {
    return (
      <Container>
        <p className="text-muted-foreground">Coach not found. Please run the seed script.</p>
      </Container>
    );
  }

  const notificationPrefs =
    typeof coach.notificationPreferences === 'object' && coach.notificationPreferences !== null
      ? (coach.notificationPreferences as { emailOnWorkoutComplete: boolean; emailOnCheckIn: boolean })
      : { emailOnWorkoutComplete: true, emailOnCheckIn: true };

  return (
    <Container>
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your profile and preferences.</p>
        </div>
        <SettingsForm
          initialData={{
            id: coach.id,
            name: coach.name,
            email: coach.email,
            brandName: coach.brandName,
            defaultWeightUnit: coach.defaultWeightUnit as 'kg' | 'lbs',
            timezone: coach.timezone,
            defaultRestTimerSeconds: coach.defaultRestTimerSeconds,
            notificationPreferences: notificationPrefs,
          }}
        />
      </div>
    </Container>
  );
}
