"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const LAST_UPDATED = "April 1, 2026";

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="flex items-center justify-between px-4 py-3 md:py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-8 w-8 text-foreground hover:bg-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">Privacy Policy</h1>
          <div className="w-8" />
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-8 px-4 py-12 text-foreground">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Privacy Policy for ekra</h2>
          <p className="mt-2 text-muted-foreground">
            <strong>Last updated:</strong> {LAST_UPDATED}
          </p>
        </div>

        <div
          className="rounded-2xl border border-border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground"
          role="note"
        >
          <p className="font-semibold text-foreground">Disclaimer</p>
          <p className="mt-2">
            This document is a template for informational purposes and does not constitute legal
            advice. Laws in Saudi Arabia, particularly the PDPL, carry significant penalties for
            non-compliance. You should have this draft reviewed by a licensed Saudi legal
            professional before publishing.
          </p>
        </div>

        <div className="prose prose-neutral max-w-none dark:prose-invert space-y-6 text-muted-foreground">
          <p>
            Welcome to <strong className="text-foreground">ekra</strong>. We are committed to
            protecting your privacy and ensuring your personal data is handled securely and
            transparently in accordance with the{" "}
            <strong className="text-foreground">Saudi Personal Data Protection Law (PDPL)</strong>
            .
          </p>

          <h3 className="text-lg font-semibold text-foreground">1. Introduction</h3>
          <p>
            This Privacy Policy explains how <strong className="text-foreground">ekra</strong> (
            &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), as the{" "}
            <strong className="text-foreground">Data Controller</strong>, collects, uses, processes,
            and shares your personal data when you use our website and mobile application. By using
            ekra, you provide your <strong className="text-foreground">explicit consent</strong> to
            the practices described here. This policy should be read together with our{" "}
            <Link href="/terms" className="font-medium text-primary underline-offset-4 hover:underline">
              Terms of Service
            </Link>
            .
          </p>

          <h3 className="text-lg font-semibold text-foreground">2. Information We Collect</h3>
          <p>To facilitate a secure rental marketplace, we collect the following:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-foreground">Identity Data:</strong> Full name, date of birth,
              and gender.
            </li>
            <li>
              <strong className="text-foreground">Verification Data:</strong> National ID
              (Iqama/Saudi ID) numbers. We may use the{" "}
              <strong className="text-foreground">Nafath (National Single Sign-On)</strong> system to
              verify your identity.
            </li>
            <li>
              <strong className="text-foreground">Contact Data:</strong> Email address, phone number,
              and physical address.
            </li>
            <li>
              <strong className="text-foreground">Transaction Data:</strong> Details of items listed,
              rental history, and reviews.
            </li>
            <li>
              <strong className="text-foreground">Financial Data:</strong> Bank account details and
              payment card information (processed via secure, SAMA-regulated payment gateways).
            </li>
            <li>
              <strong className="text-foreground">Technical Data:</strong> IP address, device type,
              and usage patterns collected through cookies.
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-foreground">3. Purpose of Processing</h3>
          <p>We process your data only for the following &quot;Lawful Bases&quot;:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-foreground">Contractual Necessity:</strong> To manage your
              account, facilitate rentals between users, and process payments.
            </li>
            <li>
              <strong className="text-foreground">Security &amp; Verification:</strong> To vet users
              (similar to Fat Llama&apos;s vetting) to prevent fraud and ensure community safety.
            </li>
            <li>
              <strong className="text-foreground">Legal Obligation:</strong> To comply with Saudi
              regulations, including anti-money laundering (AML) and tax requirements.
            </li>
            <li>
              <strong className="text-foreground">Legitimate Interest:</strong> To improve our
              platform&apos;s performance and user experience.
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-foreground">4. Data Sharing &amp; Disclosure</h3>
          <p>We do not sell your data. We only share data with:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-foreground">The Other Party in a Rental:</strong> We share
              necessary contact details between the Lender and Renter once a booking is confirmed.
            </li>
            <li>
              <strong className="text-foreground">Verification Providers:</strong> National
              information centers (Nafath) to confirm your identity.
            </li>
            <li>
              <strong className="text-foreground">Payment Processors:</strong> Regulated entities that
              handle financial transactions.
            </li>
            <li>
              <strong className="text-foreground">Insurance Partners:</strong> If a claim is filed
              for a damaged or stolen item.
            </li>
            <li>
              <strong className="text-foreground">Authorities:</strong> When required by Saudi law or
              for the protection of our rights.
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-foreground">
            5. Data Storage &amp; International Transfers
          </h3>
          <p>
            In compliance with the PDPL, your personal data is primarily stored on secure servers
            located within the <strong className="text-foreground">Kingdom of Saudi Arabia</strong>
            . Any transfer of data outside the Kingdom will only occur under strict safeguards
            approved by SDAIA and in accordance with the PDPL Implementing Regulations.
          </p>

          <h3 className="text-lg font-semibold text-foreground">6. Your Rights as a Data Subject</h3>
          <p>Under the Saudi PDPL, you have the following rights:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-foreground">Right to Know:</strong> To be informed about the
              legal basis and purpose of data collection.
            </li>
            <li>
              <strong className="text-foreground">Right to Access:</strong> To request a copy of the
              personal data we hold about you.
            </li>
            <li>
              <strong className="text-foreground">Right to Correction:</strong> To request the
              update or correction of any inaccurate data.
            </li>
            <li>
              <strong className="text-foreground">Right to Destruction:</strong> To request the
              deletion of your data when it is no longer needed for the purpose it was collected
              (subject to statutory retention periods).
            </li>
            <li>
              <strong className="text-foreground">Right to Withdraw Consent:</strong> You may
              withdraw your consent at any time, though this may limit your ability to use the
              platform.
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-foreground">7. Security Measures</h3>
          <p>
            We implement &quot;Privacy by Design&quot; and use industry-standard encryption
            (SSL/TLS) to protect your data. Access to personal data is restricted to authorized
            personnel who require it to perform their duties.
          </p>

          <h3 className="text-lg font-semibold text-foreground">8. Contact Us</h3>
          <p>
            If you have questions about this policy or wish to exercise your rights, please contact
            our <strong className="text-foreground">Data Protection Officer (DPO)</strong>:
          </p>
          <ul className="list-none space-y-2 pl-0">
            <li>
              <strong className="text-foreground">Email:</strong>{" "}
              <a
                href="mailto:privacy@ekra.sa"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                privacy@ekra.sa
              </a>
            </li>
            <li>
              <strong className="text-foreground">Address:</strong> Riyadh, Saudi Arabia
            </li>
          </ul>
          <p>
            You may also reach us through our{" "}
            <Link href="/contact" className="font-medium text-primary underline-offset-4 hover:underline">
              contact page
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
