import { Container } from '@/components/layout/Container';

export default function ExercisesLoading() {
  return (
    <Container className="py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="h-9 w-48 bg-muted animate-pulse rounded" />
        <div className="h-5 w-40 bg-muted animate-pulse rounded mt-2" />
      </div>

      {/* Search and filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
        <div className="h-10 w-full sm:w-72 bg-muted animate-pulse rounded-md" />
        <div className="flex gap-2 flex-wrap">
          {['Strength', 'Powerlifting', 'Stretching', 'Plyometrics'].map((cat) => (
            <div key={cat} className="h-8 w-24 bg-muted animate-pulse rounded-full" />
          ))}
        </div>
      </div>

      {/* Tag filters */}
      <div className="flex gap-2 mb-6">
        {['Competition', 'Variation', 'Accessory', 'GPP'].map((tag) => (
          <div key={tag} className="h-7 w-24 bg-muted animate-pulse rounded-full" />
        ))}
      </div>

      {/* Exercise list */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
            <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            <div className="h-4 w-48 bg-muted animate-pulse rounded" />
            <div className="ml-auto flex gap-2">
              <div className="h-5 w-16 bg-muted animate-pulse rounded-full" />
              <div className="h-5 w-20 bg-muted animate-pulse rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
