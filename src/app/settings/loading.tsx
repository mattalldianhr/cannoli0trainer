import { Container } from '@/components/layout/Container';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function SettingsLoading() {
  return (
    <Container>
      <div className="max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <div className="h-7 w-28 bg-muted animate-pulse rounded" />
          <div className="h-5 w-56 bg-muted animate-pulse rounded mt-2" />
        </div>

        {/* Profile section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="h-6 w-24 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent className="space-y-4">
            {['Name', 'Email', 'Brand Name'].map((field) => (
              <div key={field}>
                <div className="h-4 w-20 bg-muted animate-pulse rounded mb-2" />
                <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Preferences section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent className="space-y-4">
            {['Weight Unit', 'Timezone', 'Rest Timer'].map((field) => (
              <div key={field}>
                <div className="h-4 w-24 bg-muted animate-pulse rounded mb-2" />
                <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Save button */}
        <div className="h-10 w-24 bg-muted animate-pulse rounded-md" />
      </div>
    </Container>
  );
}
