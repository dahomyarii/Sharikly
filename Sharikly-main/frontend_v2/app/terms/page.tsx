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
        <h2 className="text-2xl font-bold text-gray-900">Terms of Service</h2>
        <p className="text-gray-600">
          Last updated: {new Date().toLocaleDateString()}
        </p>
        <div className="prose prose-gray max-w-none space-y-4 text-gray-700">
          <p>
            Welcome to EKRA. By using our platform you agree to these terms. Please read them carefully.
          </p>
          <h3 className="text-lg font-semibold text-gray-900">1. Use of the platform</h3>
          <p>
            You must use the service in accordance with applicable laws and our policies. You are responsible for the accuracy of listings and for honoring bookings you accept.
          </p>
          <h3 className="text-lg font-semibold text-gray-900">2. Accounts</h3>
          <p>
            You must provide accurate information when registering. You are responsible for keeping your account secure and for all activity under your account.
          </p>
          <h3 className="text-lg font-semibold text-gray-900">3. Listings and bookings</h3>
          <p>
            Listers are responsible for the condition of items and for fulfilling bookings. Renters must return items on time and in the condition received. Disputes should be reported to support.
          </p>
          <h3 className="text-lg font-semibold text-gray-900">4. Contact</h3>
          <p>
            For questions about these terms, please <Link href="/contact" className="text-blue-600 hover:underline">contact us</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
