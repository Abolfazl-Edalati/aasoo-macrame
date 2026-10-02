import type { Metadata } from "next";
import { StaffLoginForm } from "@/components/auth/StaffLoginForm";

export const metadata: Metadata = {
  title: "ورود کارکنان",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLoginPage() {
  return (
    <main id="main" className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-sm">
        <StaffLoginForm />
      </div>
    </main>
  );
}
