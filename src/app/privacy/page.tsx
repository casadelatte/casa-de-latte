import type { Metadata } from "next";
import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy — Casa De Latte",
  description:
    "Learn how Casa De Latte collects, uses, and protects the information you share when placing an order through our platform.",
};

const EFFECTIVE_DATE = "9 June 2026";
const CONTACT_EMAIL = "admincasadelatte@gmail.com";
const CONTACT_PHONE = "+91 91007 41010";

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen bg-matte-black text-cream-light overflow-x-hidden">
      {/* Ambient background — matches site-wide style */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(170,236,239,0.10) 0%, transparent 55%), radial-gradient(ellipse 55% 40% at 90% 60%, rgba(170,236,239,0.05) 0%, transparent 50%)",
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
              <Shield size={15} className="text-crema" />
            </div>
            <span className="text-[10px] uppercase tracking-[0.28em] text-crema font-bold">
              Casa De Latte
            </span>
          </div>
          <h1
            className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-cream-light mb-3"
          >
            Privacy Policy
          </h1>
          <p className="text-xs text-warm-beige/40 tracking-[0.12em] uppercase">
            Effective {EFFECTIVE_DATE}
          </p>
          <div className="w-16 h-px bg-crema/25 mt-5" />
        </header>

        {/* Intro */}
        <Section>
          <p className="text-sm text-warm-beige/70 leading-relaxed">
            At <strong className="text-crema/80">Casa De Latte</strong>, we value the trust you place
            in us when you use our ordering platform. This Privacy Policy explains, in plain terms,
            what information we collect when you place an order, how we use it, and how we keep it
            safe. We do not sell your data — full stop.
          </p>
        </Section>

        {/* 1 */}
        <Section>
          <Heading number="1" title="What Information We Collect" />
          <p className="text-sm text-warm-beige/70 leading-relaxed mb-4">
            When you place an order through Casa De Latte, we collect only what is strictly necessary
            to fulfil and track your order:
          </p>
          <ul className="space-y-2">
            <ListItem label="Your name" detail="used to identify your order at delivery." />
            <ListItem label="Your phone number" detail="used if we need to contact you about your order." />
            <ListItem label="Your vehicle details" detail="car colour and licence plate, used so our baristas can locate you in the parking area." />
            <ListItem label="Your order" detail="the items, customisations, quantities, and total amount." />
            <ListItem label="Order timestamp" detail="when the order was placed." />
          </ul>
          <p className="text-sm text-warm-beige/50 leading-relaxed mt-4">
            We do <strong className="text-warm-beige/70">not</strong> collect passwords, payment card
            details, government IDs, or any sensitive personal information. No customer accounts are
            created and no cookies are set for tracking purposes.
          </p>
        </Section>

        {/* 2 */}
        <Section>
          <Heading number="2" title="How We Use Your Information" />
          <p className="text-sm text-warm-beige/70 leading-relaxed mb-4">
            The information you provide is used exclusively for:
          </p>
          <ul className="space-y-2">
            <ListItem label="Processing your order" detail="passing your order to our baristas and linking it to your vehicle." />
            <ListItem label="Order tracking" detail="giving you a real-time status link so you can see when your order is being prepared and when it is ready." />
            <ListItem label="Internal operations" detail="our admin team uses order data to manage the queue and improve service speed." />
          </ul>
          <p className="text-sm text-warm-beige/50 leading-relaxed mt-4">
            We do not use your information for marketing, profiling, automated decision-making, or
            any purpose beyond fulfilling your current order.
          </p>
        </Section>

        {/* 3 */}
        <Section>
          <Heading number="3" title="Data Storage & Security" />
          <p className="text-sm text-warm-beige/70 leading-relaxed">
            Your order data is stored in a secure, encrypted database hosted by{" "}
            <span className="text-crema/70">Supabase</span>, a GDPR-compliant cloud database
            provider. Our ordering platform is hosted on{" "}
            <span className="text-crema/70">Vercel</span>, which enforces HTTPS on all connections.
            Access to order data is restricted to authorised Casa De Latte staff only and is
            protected by admin authentication.
          </p>
          <p className="text-sm text-warm-beige/50 leading-relaxed mt-4">
            While we take reasonable precautions to protect your data, no system is completely
            impenetrable. We encourage you not to share sensitive information beyond what is
            required to place an order.
          </p>
        </Section>

        {/* 4 */}
        <Section>
          <Heading number="4" title="Data Retention" />
          <p className="text-sm text-warm-beige/70 leading-relaxed">
            Order records are retained for a reasonable period to support operational needs such as
            resolving disputes or reviewing service quality. We do not store your phone number or
            vehicle details beyond what is needed to complete the associated order.
          </p>
        </Section>

        {/* 5 */}
        <Section>
          <Heading number="5" title="Third-Party Services" />
          <p className="text-sm text-warm-beige/70 leading-relaxed mb-4">
            We use the following third-party services to operate the platform:
          </p>
          <ul className="space-y-2">
            <ListItem label="Supabase" detail="database and real-time data infrastructure." />
            <ListItem label="Vercel" detail="website hosting and deployment." />
          </ul>
          <p className="text-sm text-warm-beige/50 leading-relaxed mt-4">
            These providers are bound by their own privacy policies and are used solely for
            infrastructure purposes. We do not share your data with advertisers, analytics platforms,
            or any third party for commercial purposes.
          </p>
        </Section>

        {/* 6 */}
        <Section>
          <Heading number="6" title="Your Rights" />
          <p className="text-sm text-warm-beige/70 leading-relaxed mb-4">
            You have the right to:
          </p>
          <ul className="space-y-2">
            <ListItem label="Request access" detail="ask us what information we hold relating to an order you placed." />
            <ListItem label="Request deletion" detail="ask us to remove your order and personal details from our records." />
            <ListItem label="Correct inaccuracies" detail="let us know if any information we hold is incorrect." />
          </ul>
          <p className="text-sm text-warm-beige/50 leading-relaxed mt-4">
            To exercise any of these rights, please contact us using the details in Section 7. We
            will respond within a reasonable timeframe.
          </p>
        </Section>

        {/* 7 */}
        <Section>
          <Heading number="7" title="Contact Us" />
          <p className="text-sm text-warm-beige/70 leading-relaxed mb-4">
            If you have any questions or concerns about this Privacy Policy or how your information
            is handled, please reach out to us:
          </p>
          <div className="glass rounded-2xl p-5 border border-white/5 space-y-2">
            <p className="text-sm text-warm-beige/80">
              <span className="text-crema/60 text-[11px] uppercase tracking-widest font-bold block mb-0.5">Business</span>
              Casa De Latte
            </p>
            <p className="text-sm text-warm-beige/80">
              <span className="text-crema/60 text-[11px] uppercase tracking-widest font-bold block mb-0.5">Email</span>
              <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-crema transition-colors duration-300">
                {CONTACT_EMAIL}
              </a>
            </p>
            <p className="text-sm text-warm-beige/80">
              <span className="text-crema/60 text-[11px] uppercase tracking-widest font-bold block mb-0.5">Phone</span>
              <a href={`tel:${CONTACT_PHONE.replace(/\s/g, "")}`} className="hover:text-crema transition-colors duration-300">
                {CONTACT_PHONE}
              </a>
            </p>
            <p className="text-sm text-warm-beige/80">
              <span className="text-crema/60 text-[11px] uppercase tracking-widest font-bold block mb-0.5">Location</span>
              Parking lot 2, KBR Park, Road No. 2, Banjara Hills, Hyderabad – 500034
            </p>
          </div>
        </Section>

        {/* 8 */}
        <Section>
          <Heading number="8" title="Updates to This Policy" />
          <p className="text-sm text-warm-beige/70 leading-relaxed">
            We may update this Privacy Policy from time to time. The effective date at the top of
            this page will reflect when the latest version was published. We encourage you to review
            this page occasionally. Continued use of the ordering platform after any changes
            constitutes your acceptance of the updated policy.
          </p>
        </Section>

        {/* Footer link row */}
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-warm-beige/30 tracking-wide">
            &copy; 2026 Casa De Latte. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <Link href="/terms" className="text-[11px] text-warm-beige/40 hover:text-crema transition-colors duration-300 tracking-wide">
              Terms of Service
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
