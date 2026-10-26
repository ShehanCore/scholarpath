import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-ui";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = { title: "New password", robots: { index: false, follow: false } };

// Reached from the reset email (the proxy sends signed-out visitors to log in).
export default function NewPasswordPage() {
  return (
    <AuthCard title="Choose a new password" closeHref="/account">
      <PasswordForm />
    </AuthCard>
  );
}
