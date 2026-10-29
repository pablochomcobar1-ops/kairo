import { CartDrawer } from "@/components/cart/CartDrawer";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

/** Every shopper-facing page: header, content, footer and the cart drawer. */
export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}
