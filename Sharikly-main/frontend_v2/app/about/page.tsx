"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/LocaleProvider";

export default function AboutPage() {
  const router = useRouter();
  const { t } = useLocale();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3 md:py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-gray-800 hover:bg-gray-100 h-8 w-8"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">{t("about_us")}</h1>
          <div className="w-8" />
        </div>
      </header>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <div className="space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            {t("about_ekra")}
          </h2>
          <p className="text-lg text-muted-foreground">{t("ekra_description")}</p>
        </div>

        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-foreground">
            {t("our_mission")}
          </h3>
          <p className="text-muted-foreground leading-relaxed">{t("mission_text")}</p>
        </div>

        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-foreground">{t("why_ekra")}</h3>
          <ul className="space-y-3 text-muted-foreground">
            <li className="flex gap-3">
              <span className="text-blue-600 font-bold">✓</span>
              <span>{t("safe_transactions")}</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-600 font-bold">✓</span>
              <span>{t("easy_to_use")}</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-600 font-bold">✓</span>
              <span>{t("community_driven")}</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-600 font-bold">✓</span>
              <span>{t("verified_sellers")}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
