"use client";

import { ArrowLeft, Search, Calendar, CreditCard, Package, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const steps = [
  { icon: Search, title: "Browse", text: "Find cameras, lenses, and gear near you. Filter by category, price, and location." },
  { icon: Calendar, title: "Request", text: "Select your dates and send a booking request. The owner will accept or decline." },
  { icon: CreditCard, title: "Pay", text: "Once accepted, pay securely online. You'll get a receipt and confirmation." },
  { icon: Package, title: "Enjoy", text: "Pick up the item, use it for your rental period, and return it in the same condition." },
];

const faqs = [
  { q: "How do I book an item?", a: "Go to the listing, choose your dates, and click \"Send Request.\" The owner will respond. If they accept, you'll pay and complete the booking." },
  { q: "When do I pay?", a: "Payment is due after the owner accepts your request. You'll be redirected to a secure checkout." },
  { q: "What if I need to cancel?", a: "Cancel from your Bookings page. Refund policy depends on how close to the start date you cancel—check the listing or contact the owner." },
  { q: "How do I list my gear?", a: "Sign up, go to \"List Item,\" add photos and details, set your price and location. You'll receive requests and can accept or decline." },
];

export default function HowItWorksPage() {
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
          <h1 className="text-lg font-bold text-gray-900">How it works</h1>
          <div className="w-8" />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Rent gear in four steps
          </h2>
          <p className="text-gray-600">
            Browse, request, pay, and enjoy. Simple and secure.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={i}
                className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                    Step {i + 1}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900 mt-0.5">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{step.text}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-8 border-t border-gray-200">
          <h3 className="flex items-center gap-2 text-xl font-bold text-gray-900 mb-6">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            Frequently asked questions
          </h3>
          <ul className="space-y-4">
            {faqs.map((faq, i) => (
              <li key={i} className="border-b border-gray-100 pb-4 last:border-0">
                <p className="font-semibold text-gray-900">{faq.q}</p>
                <p className="text-sm text-gray-600 mt-1">{faq.a}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-center pt-4">
          <Link href="/listings">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Browse listings
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
