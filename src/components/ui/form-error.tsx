interface FormErrorProps {
  message?: string | null;
}

export function FormError({ message }: FormErrorProps) {
  if (!message) return null;
  return <p className="text-sm text-destructive mt-1">{message}</p>;
}
