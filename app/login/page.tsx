import type { Metadata } from "next";
import { getContactChannels } from "@/lib/storefront";
import { CustomerLoginForm } from "@/components/auth/CustomerLoginForm";

export const metadata: Metadata = {
  title: "ورود به حساب کاربری",
  description: "ورود و ثبت‌نام سریع با شماره موبایل در فروشگاه مکرومه گِرِه",
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage(props: LoginPageProps) {
  const searchParams = await props.searchParams;
  const nextUrl = searchParams.next;
  const contactChannels = getContactChannels();

  return (
    <main id="main" className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <CustomerLoginForm nextUrl={nextUrl} contactChannels={contactChannels} />
      </div>
    </main>
  );
}
