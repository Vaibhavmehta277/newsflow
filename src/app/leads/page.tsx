"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import LeadsDashboard from "@/components/LeadsDashboard";

export default function LeadsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[#09090b]">
      <Sidebar
        activeCategory="all"
        onCategoryChange={() => router.push("/")}
        viewMode="feed"
        onViewModeChange={() => router.push("/")}
      />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <LeadsDashboard />
      </main>
    </div>
  );
}
