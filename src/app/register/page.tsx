import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-ui";
import { RegisterFlow } from "@/components/auth/register-flow";
import { getDestinations, getScholarships } from "@/lib/db/queries";

export const metadata: Metadata = { title: "Create your account", robots: { index: false, follow: true } };

export default async function RegisterPage() {
  const [scholarships, destinations] = await Promise.all([getScholarships(), getDestinations()]);
  return (
    <AuthCard title="Create your account">
      <Suspense>
        <RegisterFlow scholarships={scholarships} destinations={destinations.map((d) => ({ code: d.code, name: d.name }))} />
      </Suspense>
    </AuthCard>
  );
}
