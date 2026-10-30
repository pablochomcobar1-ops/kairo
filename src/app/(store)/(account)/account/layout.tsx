import { Suspense } from "react";
import { AccountNav, AccountNavLinks } from "@/components/account/AccountNav";

/** Account area: a short menu beside (or above, on phones) each page. Always Noir. */
export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <div className="px-gutter pt-10 pb-section md:pt-14">
      <div className="mx-auto grid max-w-site gap-10 md:grid-cols-[14rem_1fr] md:gap-16">
        <Suspense fallback={<AccountNavLinks path="" />}>
          <AccountNav />
        </Suspense>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
