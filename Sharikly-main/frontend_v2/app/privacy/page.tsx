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
        <h2 className="text-2xl font-bold text-gray-900">Privacy Policy</h2>
        <p className="text-gray-600">
          Last updated: {new Date().toLocaleDateString()}
        </p>
        <div className="prose prose-gray max-w-none space-y-4 text-gray-700">
          <p>
            EKRA respects your privacy. This policy describes how we collect, use, and protect your information.
          </p>
          <h3 className="text-lg font-semibold text-gray-900">1. Information we collect</h3>
          <p>
            We collect information you provide when registering (email, name, profile), when creating listings, when making or accepting bookings, and when you contact support. We may also collect usage data to improve the service.
          </p>
          <h3 className="text-lg font-semibold text-gray-900">2. How we use it</h3>
          <p>
            We use your information to operate the platform, process bookings, communicate with you, improve our services, and comply with legal obligations.
          </p>
          <h3 className="text-lg font-semibold text-gray-900">3. Sharing</h3>
          <p>
            We do not sell your personal data. We may share information with service providers that help us run the platform, or when required by law.
          </p>
          <h3 id="cookies" className="text-lg font-semibold text-gray-900">4. Cookies</h3>
          <p>
            We use cookies and similar technologies for authentication, preferences, and analytics. You can adjust your browser settings to limit cookies.
          </p>
          <h3 className="text-lg font-semibold text-gray-900">5. Contact</h3>
          <p>
            For privacy-related questions, please <Link href="/contact" className="text-blue-600 hover:underline">contact us</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
