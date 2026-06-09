import type { Metadata } from "next";
import Link from "next/link";
import { ScrollText, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service — Casa De Latte",
  description:
    "Read the terms and conditions that apply when you use the Casa De Latte drive-in coffee ordering platform.",
};

const EFFECTIVE_DATE = "9 June 2026";
const CONTACT_EMAIL = "admincasadelatte@gmail.com";

export default function TermsPage() {
  return (
    <div className="relative min-h-screen bg-matte-black text-cream-light overflow-x-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(170,236,239,0.10) 0%, transparent 55%), radial-gradient(ellipse 55% 40% at 10% 70%, rgba(170,236,239,0.05) 0%, transparent 50%)",
          }}
          aria-hidden
        />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 py-16 md:py-24">

        {/* Back to menu */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-warm-beige/50 hover:text-crema transition-colors duration-300 mb-12 font-bold"
        >
          <ArrowLeft size={13} />
          Back to Menu
        </Link>

        {/* Page header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-crema/10 border border-crema/20 flex items-center justify-center shrink-0">
              <ScrollText size={15} className="text-crema" />
            </div>
            <span className="text-[10px] uppercase tracking-[0.28em] text-crema font-bold">
              Casa De Latte
            </span>
          </div>
          <h1
            className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-cream-light mb-3"
          >
            Terms of Service
          </h1>
          <p className="text-xs text-warm-beige/40 tracking-[0.12em] uppercase">
            Effective {EFFECTIVE_DATE}
          </p>
          <div className="w-16 h-px bg-crema/25 mt-5" />
        </header>

        {/* Intro */}
        <Section>
          <p className="text-sm text-warm-beige/70 leading-relaxed">
            By using the <strong className="text-crema/80">Casa De Latte</strong> ordering platform
            — whether on your phone, tablet, or any other device — you agree to the following terms.
            Please read them before placing an order. These terms are written to be straightforward
            and fair; if anything is unclear, you are welcome to contact us before ordering.
          </p>
        </Section>

        {/* 1 */}
        <Section>
          <Heading number="1" title="The Ordering Process" />
          <p className="text-sm text-warm-beige/70 leading-relaxed mb-4">
            Our platform is designed exclusively for drive-in customers at the Casa De Latte
            location at KBR Park, Hyderabad. Here is how an order works:
          </p>
          <ol className="space-y-3">
            <NumberedItem n="1" text="You browse the menu, select items, and customise your order (temperature, milk type, syrups, etc.)." />
            <NumberedItem n="2" text="You enter your name, phone number, car colour, and licence plate." />
            <NumberedItem n="3" text="Your order is submitted and passed to our baristas in real time." />
            <NumberedItem n="4" text="You can track your order status through the link provided on the confirmation screen." />
            <NumberedItem n="5" text="When your order is marked Ready, our barista brings it to your car. Payment is collected at delivery." />
          </ol>
          <p className="text-sm text-warm-beige/50 leading-relaxed mt-4">
            An order is considered placed the moment you submit it. Once submitted, changes to the
            order cannot be guaranteed, as preparation may have already begun.
          </p>
        </Section>

        {/* 2 */}
        <Section>
          <Heading number="2" title="Menu Availability" />
          <p className="text-sm text-warm-beige/70 leading-relaxed">
            Our menu is subject to change without prior notice. Item availability depends on
            ingredient stock, time of day, and operational conditions. We reserve the right to
            remove, modify, or temporarily suspend any item from the menu at any time.
          </p>
          <p className="text-sm text-warm-beige/50 leading-relaxed mt-4">
            Certain menu categories may be restricted during late-night hours as indicated on the
            ordering interface. If an item you ordered cannot be prepared, we will notify you via
            the phone number provided.
          </p>
        </Section>

        {/* 3 */}
        <Section>
          <Heading number="3" title="Pricing" />
          <p className="text-sm text-warm-beige/70 leading-relaxed">
            All prices displayed on the platform are in Indian Rupees (₹) and are inclusive of
            applicable taxes (5% GST). The total shown at checkout is the amount you will be asked
            to pay at delivery.
          </p>
          <p className="text-sm text-warm-beige/50 leading-relaxed mt-4">
            Casa De Latte reserves the right to update prices at any time. The price displayed at
            the time you place your order will be honoured for that order. We are not responsible
            for price discrepancies caused by outdated browser cache — refreshing the page before
            ordering will always show the current price.
          </p>
        </Section>

        {/* 4 */}
        <Section>
          <Heading number="4" title="Ordering Hours & Business Hours" />
          <p className="text-sm text-warm-beige/70 leading-relaxed">
            The ordering platform operates only during Casa De Latte&apos;s active business hours.
            When we are closed, the platform will indicate this and prevent new orders from being
            placed. Orders submitted close to closing time may be processed at our discretion.
          </p>
        </Section>

        {/* 5 */}
        <Section>
          <Heading number="5" title="Cancellation Policy" />
          <p className="text-sm text-warm-beige/70 leading-relaxed mb-4">
            Once an order is placed:
          </p>
          <ul className="space-y-2">
            <ListItem label="Before preparation begins" detail="cancellations may be accommodated if you call us immediately after placing the order." />
            <ListItem label="After preparation has begun" detail="cancellations cannot be processed, as ingredients and barista time have already been committed." />
            <ListItem label="Rejected orders" detail="if we are unable to fulfil your order, it will be marked as Rejected and you will not be charged." />
          </ul>
          <p className="text-sm text-warm-beige/50 leading-relaxed mt-4">
            Payment is only collected at delivery, so there is no charge until you receive your
            order.
          </p>
        </Section>

        {/* 6 */}
        <Section>
          <Heading number="6" title="Customer Responsibilities" />
          <p className="text-sm text-warm-beige/70 leading-relaxed mb-4">
            When placing an order, you agree to:
          </p>
          <ul className="space-y-2">
            <ListItem label="Accurate information" detail="provide your correct name, phone number, car colour, and licence plate so our baristas can locate you." />
            <ListItem label="Availability at delivery" detail="be present in or near your vehicle when the order is marked Ready." />
            <ListItem label="Payment readiness" detail="have the total amount available at the time of delivery." />
            <ListItem label="Respectful conduct" detail="treat Casa De Latte staff with courtesy and respect at all times." />
          </ul>
          <p className="text-sm text-warm-beige/50 leading-relaxed mt-4">
            Orders placed with false or misleading information may be cancelled at our discretion.
            Repeated abuse of the ordering system may result in restricted access.
          </p>
        </Section>

        {/* 7 */}
        <Section>
          <Heading number="7" title="Limitation of Liability" />
          <p className="text-sm text-warm-beige/70 leading-relaxed">
            Casa De Latte provides this ordering platform on an &ldquo;as is&rdquo; basis. While we
            make every effort to ensure the platform operates reliably, we cannot guarantee
            uninterrupted service at all times.
          </p>
          <p className="text-sm text-warm-beige/50 leading-relaxed mt-4">
            To the fullest extent permitted under applicable law, Casa De Latte shall not be liable
            for any indirect, incidental, or consequential loss arising from the use or inability to
            use this platform — including but not limited to delays in order confirmation, temporary
            service outages, or technical errors. Our total liability for any single order shall not
            exceed the value of that order.
          </p>
        </Section>

        {/* 8 */}
        <Section>
          <Heading number="8" title="Intellectual Property" />
          <p className="text-sm text-warm-beige/70 leading-relaxed">
            All content on this platform — including the Casa De Latte name, logo, branding,
            menu descriptions, and design — is the property of Casa De Latte. You may not reproduce,
            copy, or redistribute any part of this platform without our prior written consent.
          </p>
        </Section>

        {/* 9 */}
        <Section>
          <Heading number="9" title="Governing Law" />
          <p className="text-sm text-warm-beige/70 leading-relaxed">
            These Terms of Service are governed by and construed in accordance with the laws of
            India. Any disputes arising from or in connection with these terms shall be subject to
            the exclusive jurisdiction of the courts in Hyderabad, Telangana, India.
          </p>
        </Section>

        {/* 10 */}
        <Section>
          <Heading number="10" title="Changes to These Terms" />
          <p className="text-sm text-warm-beige/70 leading-relaxed">
            We may revise these Terms of Service from time to time. The effective date at the top of
            this page will be updated accordingly. By continuing to use the platform after any
            changes, you accept the revised terms. We recommend reviewing this page periodically.
          </p>
        </Section>

        {/* 11 */}
        <Section>
          <Heading number="11" title="Contact" />
          <p className="text-sm text-warm-beige/70 leading-relaxed mb-4">
            Questions about these terms? We are happy to help.
          </p>
          <div className="glass rounded-2xl p-5 border border-white/5 space-y-2">
            <p className="text-sm text-warm-beige/80">
              <span className="text-crema/60 text-[11px] uppercase tracking-widest font-bold block mb-0.5">Email</span>
              <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-crema transition-colors duration-300">
                {CONTACT_EMAIL}
              </a>
            </p>
            <p className="text-sm text-warm-beige/80">
              <span className="text-crema/60 text-[11px] uppercase tracking-widest font-bold block mb-0.5">Location</span>
              Parking lot 2, KBR Park, Road No. 2, Banjara Hills, Hyderabad – 500034
            </p>
          </div>
        </Section>

        {/* Footer link row */}
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-warm-beige/30 tracking-wide">
            &copy; 2026 Casa De Latte. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="text-[11px] text-warm-beige/40 hover:text-crema transition-colors duration-300 tracking-wide">
              Privacy Policy
            </Link>
            <Link href="/" className="text-[11px] text-crema/60 hover:text-crema transition-colors duration-300 tracking-wide font-bold">
              Back to Menu →
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ─── Local sub-components ─── */

function Section({ children }: { children: React.ReactNode }) {
  return <section className="mb-10">{children}</section>;
}

function Heading({ number, title }: { number: string; title: string }) {
  return (
    <h2 className="font-serif text-base md:text-lg font-bold text-cream-light mb-4 flex items-baseline gap-2">
      <span className="text-crema/40 text-xs font-bold tracking-widest">{number}.</span>
      {title}
    </h2>
  );
}

function ListItem({ label, detail }: { label: string; detail: string }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-warm-beige/65 leading-relaxed">
      <span className="mt-1.5 w-1 h-1 rounded-full bg-crema/40 shrink-0" aria-hidden />
      <span>
        <strong className="text-warm-beige/80 font-medium">{label}</strong>
        {" — "}
        {detail}
      </span>
    </li>
  );
}

function NumberedItem({ n, text }: { n: string; text: string }) {
  return (
    <li className="flex items-start gap-3 text-sm text-warm-beige/65 leading-relaxed">
      <span className="shrink-0 w-5 h-5 rounded-full bg-crema/10 border border-crema/20 flex items-center justify-center text-[10px] font-bold text-crema mt-0.5">
        {n}
      </span>
      <span>{text}</span>
    </li>
  );
}
