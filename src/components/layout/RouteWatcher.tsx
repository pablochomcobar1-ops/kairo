"use client";

import { usePathname } from "next/navigation";
import { Suspense, useEffect } from "react";

function Watch({ onChange }: { onChange: (pathname: string) => void }) {
  const pathname = usePathname();
  useEffect(() => onChange(pathname), [pathname, onChange]);
  return null;
}

/**
 * Tells a component which page is showing, and again after every navigation.
 * Reading the address is kept inside its own <Suspense>, because on pages whose
 * address isn't known at build time (an order page) Next.js has to wait for it,
 * and that wait must never hold up the header, the bag or the page itself.
 * `onChange` should be stable (useCallback or a state setter).
 */
export function RouteWatcher({ onChange }: { onChange: (pathname: string) => void }) {
  return (
    <Suspense fallback={null}>
      <Watch onChange={onChange} />
    </Suspense>
  );
}
