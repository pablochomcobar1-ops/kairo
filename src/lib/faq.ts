import { formatINR } from "./money";
import { FREE_SHIPPING_THRESHOLD_PAISE, MAX_QTY_PER_LINE, SHIPPING_FEE_PAISE } from "./pricing";

/**
 * Questions and answers for /faq. Plain text (no markup) so the same words
 * feed the page and the FAQ data search engines read. Store rules come from
 * the code, so the answers can't drift from what checkout actually does.
 */
export interface Faq {
  id: string;
  q: string;
  a: string;
}

export const FAQ_GROUPS: { title: string; items: Faq[] }[] = [
  {
    title: "About this store",
    items: [
      {
        id: "concept",
        q: "Is Kairo a real shop?",
        a: "Kairo is a concept store: a complete, working shop built as a portfolio project by Jainam Gondaliya. Accounts, the bag, checkout, order tracking and reviews all work, but payments run in Razorpay's test mode, so no real money moves and nothing is shipped.",
      },
      {
        id: "photos",
        q: "Are the product photos real?",
        a: "The product visuals are concept images made for this project, not photos of manufactured garments. Fabrics, fits and measurements are written as a real label would write them.",
      },
      {
        id: "reviews",
        q: "What does the Sample tag on reviews mean?",
        a: "Reviews marked Sample were written to show how the reviews section works. Reviews from shoppers are checked before they appear, and a review only carries Verified buyer when the person bought that piece.",
      },
    ],
  },
  {
    title: "Orders and payment",
    items: [
      {
        id: "pay",
        q: "How do I pay?",
        a: "Checkout uses Razorpay: UPI, cards, net banking and wallets. Prices are in Indian rupees and are worked out again on our side at checkout, so what you pay always matches our current prices.",
      },
      {
        id: "coupons",
        q: "Do you have discount codes?",
        a: "Enter a code in the Coupon box at checkout. If a code needs a minimum order or has expired, checkout tells you why it didn't apply.",
      },
      {
        id: "quantity",
        q: "Is there a limit per order?",
        a: `Up to ${MAX_QTY_PER_LINE} of each size and colour per order, so a drop isn't bought out by one person.`,
      },
      {
        id: "track",
        q: "How do I track my order?",
        a: "Use Track an order with your order number (it looks like KRO-261030-AB7K) and the email you ordered with. Signed-in shoppers also see every order under Account.",
      },
    ],
  },
  {
    title: "Delivery and returns",
    items: [
      {
        id: "delivery",
        q: "How long does delivery take?",
        a: `3 to 6 working days across India. Delivery is free on orders over ${formatINR(FREE_SHIPPING_THRESHOLD_PAISE)} after any discount, otherwise ${formatINR(SHIPPING_FEE_PAISE)}.`,
      },
      {
        id: "returns",
        q: "Can I return something?",
        a: "Yes, within 7 days of delivery, unworn and with the tags on. Pieces from a drop can be exchanged for another size but not returned, because they are never restocked.",
      },
      {
        id: "size",
        q: "How do I find my size?",
        a: "Every product page has a size guide for that kind of piece, and the full tables are on the Size guide page. Between two sizes, take the larger for a relaxed fit.",
      },
    ],
  },
  {
    title: "Drops and accounts",
    items: [
      {
        id: "drops",
        q: "How do drops work?",
        a: "A drop is a small run released at a set date and time, shown on its page in Indian time. You can look at the pieces before it opens and buy them from that moment. Leave your email on the drop's page for one reminder when it opens.",
      },
      {
        id: "account",
        q: "Do I need an account to order?",
        a: "No, guest checkout works. An account keeps your addresses, order history and wishlist in one place, on any device.",
      },
      {
        id: "data",
        q: "How do I delete my account or data?",
        a: "Send a message through the Contact page from the email on your account and we will delete your account and the data tied to it. The Privacy page lists what is kept and why.",
      },
    ],
  },
];

export const ALL_FAQS: Faq[] = FAQ_GROUPS.flatMap((g) => g.items);
