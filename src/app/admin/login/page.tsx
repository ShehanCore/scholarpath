import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLoginForm } from "./login-form";

export const metadata: Metadata = { title: "Admin sign-in" };

export default function AdminLoginPage() {
  return (
    <div className="flex justify-center py-[clamp(12px,6vh,72px)]">
      <section aria-labelledby="admin-login" className="flex w-full max-w-[460px] flex-col gap-5 rounded-card-lg bg-surface p-[clamp(20px,4vw,36px)] shadow-modal">
        <div>
          <p className="m-0 mb-2 text-xs font-semibold uppercase tracking-[.08em] text-teal">Admin</p>
          <h1 id="admin-login" className="m-0 font-heading text-[28px] leading-[1.15] font-semibold">
            Sign in to edit ScholarPath
          </h1>
        </div>
        <Suspense>
          <AdminLoginForm />
        </Suspense>
      </section>
    </div>
  );
}
