import { Container } from "@/components/layout/Container";
import { FindingsNav } from "@/components/findings/FindingsNav";

export const metadata = {
  title: "Findings | S&C Research Hub",
  description: "TeamBuildr API exploration findings, data analysis, and schema gap review.",
};

export default function FindingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Container className="py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-2">
          API Findings Dashboard
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Complete findings from the TeamBuildr API exploration and data
          extraction. Review athlete data, schema gaps, and API documentation
          before we begin building.
        </p>
      </div>
      <div className="mb-8">
        <FindingsNav />
      </div>
      {children}
    </Container>
  );
}
