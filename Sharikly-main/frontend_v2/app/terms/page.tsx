"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function TermsPage() {
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
          <h1 className="text-lg font-bold text-gray-900">Terms of Service</h1>
          <div className="w-8" />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <h2 className="text-2xl font-bold text-gray-900">EKRA Terms of Service</h2>
        <p className="text-gray-600">
          Last updated: {new Date().toLocaleDateString()}
        </p>
        <div className="prose prose-gray max-w-none space-y-4 text-gray-700">
          <p>
            Welcome to <strong>EKRA</strong> (&quot;EKRA&quot;, &quot;we&quot;, &quot;us&quot; or
            &quot;our&quot;). These Terms of Service (&quot;Terms&quot;) govern your access to and use
            of our website, mobile applications, products and services (collectively, the
            &quot;Service&quot;). Please read them carefully before using EKRA.
          </p>
          <p>
            By creating an account, accessing or using the Service, you agree to be bound by these
            Terms and our{" "}
            <Link href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </Link>
            . If you do not agree, you may not use the Service.
          </p>

          <h3 className="text-lg font-semibold text-gray-900">
            1. The EKRA platform
          </h3>
          <p>
            EKRA is an online platform that enables users to list, discover and book
            event-related services and equipment. Unless we explicitly state otherwise, EKRA
            does not itself own, control or manage any listings, and we are not a party to
            contracts directly between users.
          </p>
          <p>
            We may, from time to time, introduce additional products, features or tools. Additional
            terms may apply to certain features, and those terms become part of your agreement with
            us if you use those features.
          </p>

          <h3 className="text-lg font-semibold text-gray-900">2. Eligibility</h3>
          <p>
            You may use the Service only if you are able to form a binding contract with EKRA
            and are not barred from using the Service under applicable law. By using the Service,
            you represent and warrant that:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>You are at least the age of majority in your jurisdiction; and</li>
            <li>
              You have the full power and authority to enter into these Terms and, where you act on
              behalf of an organisation, you are authorised to bind that organisation.
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900">3. Accounts and security</h3>
          <p>
            To use certain features of the Service, you must register for an account. You agree to:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Provide accurate, current and complete information during registration.</li>
            <li>Maintain and promptly update your information as necessary.</li>
            <li>
              Keep your login credentials confidential and not share your account with anyone else.
            </li>
            <li>
              Notify us immediately of any unauthorised use of your account or any other breach of
              security.
            </li>
          </ul>
          <p>
            You are responsible for all activities that occur under your account, whether or not you
            authorised them. We reserve the right to suspend or terminate your account if we suspect
            that any information you provided is inaccurate, incomplete or in violation of these
            Terms.
          </p>

          <h3 className="text-lg font-semibold text-gray-900">4. Listings</h3>
          <p>
            Users who create listings (&quot;Hosts&quot;) are solely responsible for the accuracy,
            quality, safety, legality and availability of their listings and services. By creating a
            listing on EKRA, you agree that:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Your listing is accurate, not misleading and kept up to date.</li>
            <li>
              You have all necessary rights, permissions and licences to offer the services or
              items.
            </li>
            <li>
              You will comply with all applicable laws, regulations, permits, licences and
              requirements.
            </li>
            <li>
              You are solely responsible for any content you upload, including photos, descriptions
              and pricing.
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900">5. Bookings and payments</h3>
          <p>
            Users who request or book listings (&quot;Guests&quot;) and Hosts enter into a direct
            contractual relationship with each other. EKRA is not a party to that contract.
          </p>
            <p>By making or accepting a booking through EKRA, you agree that:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Guests are responsible for reviewing the listing details, price, house rules and any
              other applicable terms before booking.
            </li>
            <li>
              Hosts agree to honour confirmed bookings and provide the services or items as
              described in the listing.
            </li>
            <li>
              Guests agree to pay all applicable charges associated with their bookings, including
              any fees, taxes and security deposits (if applicable).
            </li>
          </ul>
          <p>
            Payment processing may be handled by third-party payment providers. Your use of such
            services may be subject to separate terms and privacy policies.
          </p>

          <h3 className="text-lg font-semibold text-gray-900">6. Cancellations, changes and refunds</h3>
          <p>
            Cancellation, change and refund policies may vary by listing and are typically set by
            the Host. Before booking, Guests should carefully review the applicable cancellation
            policy and any related terms shown for the listing.
          </p>
          <p>
            Where EKRA provides tools to manage cancellations or refunds, we will process them
            in accordance with the applicable policy and any mandatory legal obligations. We are not
            obligated to mediate disputes but may, at our discretion, assist users in resolving
            issues.
          </p>

          <h3 className="text-lg font-semibold text-gray-900">7. User conduct and prohibited activities</h3>
          <p>You agree that you will not:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Use the Service for any unlawful purpose or in violation of any law.</li>
            <li>
              Post or transmit any content that is fraudulent, misleading, defamatory, obscene,
              hateful, infringing, abusive or otherwise objectionable.
            </li>
            <li>
              Interfere with or disrupt the integrity or performance of the Service or attempt to
              gain unauthorised access to our systems.
            </li>
            <li>
              Circumvent, remove or alter any technological measures implemented to protect the
              Service or content on it.
            </li>
            <li>
              Use any automated means (such as bots, crawlers or scrapers) to access the Service
              without our prior written permission, except as permitted by applicable law.
            </li>
            <li>
              Use the Service in a way that harms or could harm EKRA, our users or any third
              party.
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900">8. Reviews and feedback</h3>
          <p>
            Users may leave public reviews, ratings or feedback. You agree that your reviews will be
            fair, honest and based on your actual experience. We may remove or hide reviews that
            violate these Terms or applicable law.
          </p>

          <h3 className="text-lg font-semibold text-gray-900">9. Intellectual property</h3>
          <p>
            The Service, including the EKRA name and logo, software, designs, text, graphics,
            images and other content, is owned by or licensed to EKRA and is protected by
            intellectual property laws. Except as expressly allowed in these Terms, you may not copy,
            modify, distribute, sell or lease any part of the Service or included software, nor may
            you reverse engineer or attempt to extract the source code.
          </p>
          <p>
            By submitting content (such as listings, photos or reviews) to the Service, you grant
            EKRA a worldwide, non-exclusive, royalty-free licence to use, reproduce, modify,
            adapt, publish, translate, create derivative works from, distribute and display such
            content in connection with operating and promoting the Service.
          </p>

          <h3 className="text-lg font-semibold text-gray-900">10. Third-party services</h3>
          <p>
            The Service may contain links to, or integrations with, third-party websites, services
            or applications. We do not control and are not responsible for the content, policies or
            practices of any third-party services. Your use of third-party services is at your own
            risk and may be subject to their terms and privacy policies.
          </p>

          <h3 className="text-lg font-semibold text-gray-900">11. Termination and suspension</h3>
          <p>
            We may suspend or terminate your access to the Service, or remove any content you post,
            at any time and for any reason, including if we reasonably believe you have violated
            these Terms, misused the Service or created risk or possible legal exposure for
            EKRA or other users.
          </p>
          <p>
            You may stop using the Service at any time and may request deletion of your account,
            subject to our obligations under law and our legitimate interests (for example, in
            maintaining necessary records).
          </p>

          <h3 className="text-lg font-semibold text-gray-900">12. Disclaimers</h3>
          <p>
            The Service is provided on an &quot;as is&quot; and &quot;as available&quot; basis,
            without warranties of any kind, whether express or implied, including implied warranties
            of merchantability, fitness for a particular purpose, non-infringement or course of
            performance.
          </p>
          <p>
            EKRA does not guarantee the accuracy or completeness of listings, the performance or
            conduct of any user, or that the Service will be uninterrupted, secure or error-free.
            Your interactions with other users and your use of listings are at your own risk.
          </p>

          <h3 className="text-lg font-semibold text-gray-900">13. Limitation of liability</h3>
          <p>
            To the maximum extent permitted by law, EKRA and its affiliates, officers,
            employees, agents and partners will not be liable for any indirect, incidental, special,
            consequential or punitive damages, or any loss of profits or revenues, whether incurred
            directly or indirectly, or any loss of data, use, goodwill or other intangible losses,
            resulting from (a) your access to or use of, or inability to access or use, the Service;
            (b) any conduct or content of any third party on the Service; or (c) unauthorised access,
            use or alteration of your content.
          </p>
          <p>
            In no event will our total liability for all claims relating to the Service exceed the
            greater of (i) the amounts you paid to EKRA in the twelve (12) months preceding the
            event giving rise to the claim or (ii) the equivalent of 100 EUR (or local currency).
          </p>

          <h3 className="text-lg font-semibold text-gray-900">14. Indemnification</h3>
          <p>
            You agree to indemnify, defend and hold harmless EKRA and its affiliates, officers,
            employees and agents from and against any claims, liabilities, damages, losses and
            expenses, including reasonable legal and accounting fees, arising out of or in any way
            connected with (a) your access to or use of the Service; (b) your content; (c) your
            violation of these Terms; or (d) your violation of any law or the rights of any third
            party.
          </p>

          <h3 className="text-lg font-semibold text-gray-900">
            15. Governing law and dispute resolution
          </h3>
          <p>
            These Terms, and any dispute or claim arising out of or in connection with them or their
            subject matter or formation, shall be governed by and construed in accordance with the
            laws of your primary operating jurisdiction, unless otherwise required by mandatory
            consumer protection law. You and EKRA agree to submit to the non-exclusive
            jurisdiction of the courts of that jurisdiction, without regard to conflict of law
            principles.
          </p>

          <h3 className="text-lg font-semibold text-gray-900">16. Changes to the Service and Terms</h3>
          <p>
            We may modify, suspend or discontinue any part of the Service at any time, with or
            without notice. We may also update these Terms from time to time. When we make material
            changes, we will provide notice, such as by updating the &quot;Last updated&quot; date
            at the top of these Terms or by sending you a notification.
          </p>
          <p>
            Your continued use of the Service after the effective date of the revised Terms
            constitutes your acceptance of the changes. If you do not agree to the updated Terms,
            you must stop using the Service.
          </p>

          <h3 className="text-lg font-semibold text-gray-900">17. Contact</h3>
          <p>
            If you have any questions about these Terms or the Service, please{" "}
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
