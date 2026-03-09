"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3 md:py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-gray-800 hover:bg-gray-100 h-8 w-8"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold text-gray-900">Privacy Policy</h1>
          <div className="w-8" />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <h2 className="text-2xl font-bold text-gray-900">EKRA Privacy Policy</h2>
        <p className="text-gray-600">
          Last updated: {new Date().toLocaleDateString()}
        </p>
        <div className="prose prose-gray max-w-none space-y-4 text-gray-700">
          <p>
            This Privacy Policy explains how <strong>EKRA</strong> (&quot;EKRA&quot;,
            &quot;we&quot;, &quot;us&quot; or &quot;our&quot;) collects, uses, discloses and
            protects your information when you use our website, mobile applications, products and
            services (collectively, the &quot;Service&quot;). It also explains the choices and
            rights you have in relation to your personal data.
          </p>
          <p>
            By accessing or using EKRA, you agree to the collection and use of information in
            accordance with this Privacy Policy. If you do not agree with this policy, please do not
            use the Service.
          </p>

          <h3 className="text-lg font-semibold text-gray-900">1. Who we are and scope</h3>
          <p>
            EKRA is a platform that enables users to list, discover and book event-related
            services and equipment. This Privacy Policy applies to all users of the Service,
            including hosts, guests and visitors to our website.
          </p>
          <p>
            For the purposes of data protection laws, we act as a &quot;data controller&quot; in
            relation to personal data processed under this Privacy Policy. If you have any questions
            about this Policy or how we handle your data, please{" "}
            <Link href="/contact" className="text-blue-600 hover:underline">
              contact us
            </Link>
            .
          </p>

          <h3 className="text-lg font-semibold text-gray-900">
            2. Information we collect
          </h3>
          <p>
            We collect information in three main ways: directly from you, automatically and from
            third parties.
          </p>

          <h4 className="text-base font-semibold text-gray-900">
            2.1 Information you provide to us
          </h4>
          <p>We collect information that you provide directly, including:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Account information</strong>: name, email address, password, profile photo,
              contact details, preferred language and any other information you choose to add to
              your profile.
            </li>
            <li>
              <strong>Listing information</strong>: titles, descriptions, photos, pricing,
              availability, location, categories and any other content you submit when creating or
              managing listings.
            </li>
            <li>
              <strong>Booking information</strong>: dates, times, services or items booked, order
              details, messages between users and other details related to bookings.
            </li>
            <li>
              <strong>Communications</strong>: messages you send through the platform, feedback,
              reviews, survey responses and communications with our support team.
            </li>
            <li>
              <strong>Payment and billing information</strong>: depending on how payments are
              processed, this may include partial payment card details (tokenised by our payment
              processor), billing address and transaction history. We do not store full payment card
              numbers on our servers.
            </li>
            <li>
              <strong>Identity or verification information</strong> (if applicable): copies of
              government-issued ID, proof of address or other verification data when needed to help
              keep the platform safe and compliant with law.
            </li>
          </ul>

          <h4 className="text-base font-semibold text-gray-900">
            2.2 Information we collect automatically
          </h4>
          <p>
            When you use EKRA, we automatically collect certain information about your device
            and usage, such as:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Usage data</strong>: pages or screens viewed, features used, search queries,
              clicks, referring/exit pages and timestamps.
            </li>
            <li>
              <strong>Device and technical data</strong>: IP address, browser type and version,
              operating system, device identifiers, language settings and mobile network
              information.
            </li>
            <li>
              <strong>Location information</strong>: approximate location derived from your IP
              address or, where you enable it, more precise location data from your device.
            </li>
            <li>
              <strong>Log and diagnostic data</strong>: error logs, performance data and other
              diagnostic information to maintain and improve the Service.
            </li>
          </ul>

          <h4 className="text-base font-semibold text-gray-900">
            2.3 Information from third parties
          </h4>
          <p>We may receive information about you from third parties, such as:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Payment processors</strong> providing us with limited payment and transaction
              details.
            </li>
            <li>
              <strong>Authentication or social login providers</strong>, where you choose to sign in
              using those services.
            </li>
            <li>
              <strong>Analytics and advertising partners</strong> who help us understand how users
              find and engage with EKRA.
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900">
            3. How we use your information
          </h3>
          <p>We use your information for the following purposes:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Providing and operating the Service</strong>, including creating and managing
              accounts, listings and bookings.
            </li>
            <li>
              <strong>Facilitating communication</strong> between users, and between you and
              Sharikly (e.g. messages, notifications and support).
            </li>
            <li>
              <strong>Processing payments</strong>, refunds and other transactions, and keeping
              proper records.
            </li>
            <li>
              <strong>Personalising your experience</strong> by showing relevant listings, content,
              recommendations and promotions.
            </li>
            <li>
              <strong>Improving and developing the Service</strong>, including analytics, research,
              testing and troubleshooting.
            </li>
            <li>
              <strong>Maintaining safety and security</strong>, detecting and preventing fraud,
              abuse, spam, security incidents and other harmful activity (including activity that
              could harm EKRA, our users or others).
            </li>
            <li>
              <strong>Complying with legal obligations</strong>, enforcing our Terms of Service and
              protecting our rights and the rights of others.
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900">
            4. Legal bases for processing (EEA/UK users)
          </h3>
          <p>
            If you are located in the European Economic Area or the United Kingdom, we process your
            personal data only where we have a valid legal basis, including:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Contract</strong>: where processing is necessary to provide the Service or
              perform our contract with you.
            </li>
            <li>
              <strong>Legitimate interests</strong>: such as operating, improving and securing the
              Service, provided that your rights and interests do not override those interests.
            </li>
            <li>
              <strong>Consent</strong>: for certain optional uses (for example, some marketing or
              certain cookies). You may withdraw your consent at any time.
            </li>
            <li>
              <strong>Legal obligations</strong>: where processing is required by applicable law.
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900">5. How we share information</h3>
          <p>
            We do <strong>not</strong> sell your personal data. We may share your information in the
            following limited circumstances:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>With other users</strong> as necessary to facilitate listings and bookings
              (for example, sharing contact details after a booking is confirmed where appropriate).
            </li>
            <li>
              <strong>With service providers</strong> who perform services on our behalf, such as
              hosting, analytics, payment processing, marketing or customer support, under
              appropriate confidentiality and security obligations.
            </li>
            <li>
              <strong>For legal and safety reasons</strong> where we believe disclosure is
              reasonably necessary to comply with law, respond to legal requests, enforce our terms,
              or protect the rights, property or safety of EKRA, our users or others.
            </li>
            <li>
              <strong>In connection with a business transaction</strong> such as a merger,
              acquisition, financing or sale of assets, where permitted by law and subject to
              appropriate safeguards.
            </li>
          </ul>

          <h3 id="cookies" className="text-lg font-semibold text-gray-900">
            6. Cookies and similar technologies
          </h3>
          <p>
            We use cookies and similar technologies to operate and personalise the Service. These
            may include:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Strictly necessary cookies</strong> for authentication, security and core site
              features.
            </li>
            <li>
              <strong>Preference cookies</strong> to remember your settings and choices.
            </li>
            <li>
              <strong>Analytics cookies</strong> to understand how the Service is used and improve
              performance.
            </li>
            <li>
              <strong>Marketing or advertising cookies</strong> (where used) to deliver and measure
              ads that may be relevant to you.
            </li>
          </ul>
          <p>
            You can control cookies through your browser settings and, where applicable, through
            on-site consent tools. Disabling some cookies may affect the functionality of the
            Service.
          </p>

          <h3 className="text-lg font-semibold text-gray-900">7. Data retention</h3>
          <p>
            We retain personal data only for as long as necessary to fulfil the purposes described
            in this Privacy Policy, including for the purposes of satisfying any legal, accounting
            or reporting requirements. When we no longer need your data, we will delete or anonymise
            it in accordance with our data retention practices, unless a longer retention period is
            required or permitted by law.
          </p>

          <h3 className="text-lg font-semibold text-gray-900">8. International transfers</h3>
          <p>
            Depending on where you are located, your information may be transferred to and processed
            in countries that may have different data protection laws than your country. Where
            required by law, we implement appropriate safeguards (such as standard contractual
            clauses) to protect your personal data when it is transferred internationally.
          </p>

          <h3 className="text-lg font-semibold text-gray-900">
            9. Security of your information
          </h3>
          <p>
            We use reasonable technical and organisational measures designed to protect your
            personal data against unauthorised access, loss, misuse or alteration. However, no
            method of transmission over the internet or method of electronic storage is completely
            secure, and we cannot guarantee absolute security.
          </p>

          <h3 className="text-lg font-semibold text-gray-900">
            10. Your rights and choices
          </h3>
          <p>
            Depending on your location, you may have certain rights in relation to your personal
            data, which may include:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Accessing a copy of the personal data we hold about you.</li>
            <li>Requesting correction of inaccurate or incomplete data.</li>
            <li>
              Requesting deletion of your personal data, subject to legal and contractual
              obligations.
            </li>
            <li>
              Objecting to or requesting restriction of certain processing activities, including
              where we rely on legitimate interests.
            </li>
            <li>
              Withdrawing consent where processing is based on your consent (for example, certain
              marketing).
            </li>
            <li>Portability of your data where applicable under law.</li>
          </ul>
          <p>
            To exercise any of these rights (where available), please{" "}
            <Link href="/contact" className="text-blue-600 hover:underline">
              contact us
            </Link>
            . We may need to verify your identity before responding to your request and may be
            unable to fully comply where legal obligations or overriding legitimate interests apply.
          </p>

          <h3 className="text-lg font-semibold text-gray-900">
            11. Children&apos;s privacy
          </h3>
          <p>
            EKRA is not directed to children and we do not knowingly collect personal data from
            children where it is prohibited by law. If you believe that a child has provided us with
            personal data without appropriate consent, please contact us so that we can take steps
            to delete such information.
          </p>

          <h3 className="text-lg font-semibold text-gray-900">
            12. Third-party links and services
          </h3>
          <p>
            The Service may contain links to third-party websites, services or applications. We are
            not responsible for the privacy practices of those third parties. We encourage you to
            review the privacy policies of any third-party services you use.
          </p>

          <h3 className="text-lg font-semibold text-gray-900">
            13. Changes to this Privacy Policy
          </h3>
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices,
            technologies, legal requirements or other factors. When we make material changes, we
            will take appropriate steps to notify you, such as by posting a prominent notice on our
            website or sending you a notification. Your continued use of the Service after the
            effective date of an updated Privacy Policy constitutes your acceptance of the changes.
          </p>

          <h3 className="text-lg font-semibold text-gray-900">14. Contact</h3>
          <p>
            If you have any questions or concerns about this Privacy Policy or our data practices,
            please{" "}
            <Link href="/contact" className="text-blue-600 hover:underline">
              contact us
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
