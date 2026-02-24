import Link from "next/link";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <AuthLayout>
      <h1 className="mb-3 font-display text-4xl tracking-tight sm:text-5xl">
        See how your HVAC business compares
      </h1>
      <p className="mb-8 text-lg text-muted-foreground">
        Get benchmarked against top-performing HVAC companies and receive a
        personalised incentive plan for your technicians — in under 5 minutes.
      </p>

      <div className="space-y-4">
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href="/signup">Try it out</Link>
        </Button>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="text-primary">&#10003;</span> Free to try
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-primary">&#10003;</span> No credit card
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-primary">&#10003;</span> 5 min setup
          </span>
        </div>
      </div>
    </AuthLayout>
  );
}
