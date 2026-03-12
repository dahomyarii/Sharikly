"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Flag, Clock } from "lucide-react";
import { safeFormatDate } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_BASE;

interface Report {
  id: number;
  listing?: { id: number; title?: string | null } | number | null;
  reported_user?: { id: number; username?: string | null } | number | null;
  reason: string;
  details?: string;
  created_at: string;
}

export default function MyReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token || !API) {
      setLoading(false);
      router.push("/auth/login");
      return;
    }
    axiosInstance
      .get(`${API}/reports/my/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const data = Array.isArray(res.data)
          ? res.data
          : (res.data?.results as Report[]) || [];
        setReports(data);
      })
      .catch(() => {
        setReports([]);
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className=\"min-h-screen bg-background flex items-center justify-center\">
        <div className=\"h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground\" />
      </div>
    );
  }

  return (
    <div className=\"min-h-screen bg-background py-4 sm:py-6 pb-24 md:pb-8\">
      <div className=\"max-w-2xl mx-auto px-3 sm:px-4\">
        <div className=\"flex items-center gap-3 mb-4 sm:mb-6\">
          <button
            onClick={() => router.back()}
            className=\"p-2 rounded-full hover:bg-muted transition\"
            aria-label=\"Back\"
          >
            <ArrowLeft className=\"w-5 h-5 text-muted-foreground\" />
          </button>
          <h1 className=\"text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2\">
            <Flag className=\"w-6 h-6\" />
            My reports
          </h1>
        </div>

        {reports.length === 0 ? (
          <Card className=\"p-8 text-center bg-card border border-border rounded-2xl shadow-sm\">
            <div className=\"w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4\">
              <Flag className=\"w-8 h-8 text-muted-foreground\" />
            </div>
            <p className=\"text-foreground font-medium mb-1\">
              You haven&apos;t submitted any reports yet.
            </p>
            <p className=\"text-sm text-muted-foreground mb-4\">
              If you see something suspicious or unsafe, you can report it from the listing or user profile.
            </p>
            <Button onClick={() => router.push(\"/listings\")}>Browse listings</Button>
          </Card>
        ) : (
          <div className=\"space-y-3\">
            {reports.map((r) => {
              const created = safeFormatDate(r.created_at);
              const isListingTarget = !!r.listing && !r.reported_user;
              const isUserTarget = !!r.reported_user && !r.listing;
              const listingId =
                typeof r.listing === \"number\" ? r.listing : (r.listing as any)?.id;
              const listingTitle =
                typeof r.listing === \"object\" && r.listing
                  ? (r.listing as any).title
                  : null;
              const reportedUserId =
                typeof r.reported_user === \"number\"
                  ? r.reported_user
                  : (r.reported_user as any)?.id;
              const reportedUsername =
                typeof r.reported_user === \"object\" && r.reported_user
                  ? (r.reported_user as any).username
                  : null;

              return (
                <Card
                  key={r.id}
                  className=\"p-4 bg-card border border-border rounded-2xl shadow-sm\"
                >
                  <div className=\"flex items-start justify-between gap-3\">
                    <div className=\"min-w-0 flex-1\">
                      <div className=\"flex items-center gap-2 mb-1\">
                        <span className=\"inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-50 text-red-600 text-xs font-semibold\">
                          !
                        </span>
                        <span className=\"text-sm font-semibold text-foreground truncate\">
                          {r.reason}
                        </span>
                      </div>
                      <div className=\"text-xs text-muted-foreground mb-2\">
                        {isListingTarget && listingId ? (
                          <button
                            type=\"button\"
                            onClick={() => router.push(`/listings/${listingId}`)}
                            className=\"underline underline-offset-2 hover:text-foreground\"
                          >
                            Listing #{listingId}
                            {listingTitle ? ` · ${listingTitle}` : \"\"}
                          </button>
                        ) : null}
                        {isUserTarget && reportedUserId ? (
                          <button
                            type=\"button\"
                            onClick={() => router.push(`/user/${reportedUserId}`)}
                            className=\"underline underline-offset-2 hover:text-foreground\"
                          >
                            User #{reportedUserId}
                            {reportedUsername ? ` · ${reportedUsername}` : \"\"}
                          </button>
                        ) : null}
                        {!isListingTarget && !isUserTarget && <span>General report</span>}
                      </div>
                      {r.details && (
                        <p className=\"text-sm text-foreground whitespace-pre-wrap break-words\">
                          {r.details}
                        </p>
                      )}
                    </div>
                    <div className=\"flex flex-col items-end gap-1 text-xs text-muted-foreground\">
                      <span className=\"inline-flex items-center gap-1\">
                        <Clock className=\"w-3 h-3\" />
                        {created}
                      </span>
                      <span className=\"px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200\">
                        Under review
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

