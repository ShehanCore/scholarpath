import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-ui";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Log in", robots: { index: false, follow: true } };

export default function LoginPage() {
  return (
    <AuthCard title="Log in">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
