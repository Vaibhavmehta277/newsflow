"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Search, RefreshCw, X } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import ArticleCard from "@/components/ArticleCard";
import ArticleDetail from "@/components/ArticleDetail";
import Overview from "@/components/Overview";
import ContentPipeline from "@/components/ContentPipeline";
import type { Article, SheetRow, Section } from "@/types";
import { COMPETITOR_NAMES } from "@/lib/keywords";

function SkeletonCard() {
  return (
    <div className="p-4 rounded-xl border border-gray-200 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-3 w-20 bg-gray-100 rounded" />
        <div className="h-3 w-12 bg-gray-100 rounded" />
      </div>
      <div className="h-4 w-full bg-gray-100 rounded mb-2" />
      <div className="h-4 w-3/4 bg-gray-100 rounded mb-3" />
      <div className="h-3 w-full bg-gray-50 rounded" />
    </div>
  );
}

const SECTION_TITLES: Record<string, { title: string; subtitle: string }> = {
  feed: {
    title: "Feed",
    subtitle: "All curated articles from the last 7 days",
  },
  "lead-alerts": {
    title: "Lead Alerts",
    subtitle: "Companies deploying voice AI — potential customers and market signals",
  },
  "competitor-watch": {
    title: "Competitor Watch",
    subtitle: "Latest from Vapi, Retell, ElevenLabs, Bland AI, Synthflow — across news, Reddit, blogs",
  },
};

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeSection, setActiveSection] = useState<Section>("overview");
  const [articles, setArticles] = useState<Article[]>([]);
  const [sheetRows, setSheetRows] = useState<SheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetsLoading, setSheetsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [localSearch, setLocalSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchArticles = useCallback(async (forceRefresh = false) => {
    try {
      const params = new URLSearchParams();
      if (forceRefresh) params.set("refresh", "true");
      const res = await fetch(`/api/feeds?${params}`);
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      setArticles(data.articles || []);
    } catch (err) {
      console.error("Failed to fetch feeds:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchSheets = useCallback(async () => {
    try {
      const res = await fetch("/api/sheets");
      if (!res.ok) throw new Error("Sheets fetch failed");
      const data = await res.json();
      setSheetRows(data.rows || []);
    } catch {
      setSheetRows([]);
    } finally {
      setSheetsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchArticles();
      fetchSheets();
    }
  }, [status, fetchArticles, fetchSheets]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchArticles(true);
    fetchSheets();
  };

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(value), 300);
  };

  // ── Section filtering using sourceTag (not keyword guessing) ──

  // Lead Alerts: articles from "lead" tagged sources
  const leadAlerts = useMemo(() => {
    return articles.filter((a) => a.sourceTag === "lead");
  }, [articles]);

  // Competitor Watch: articles from "competitor" tagged sources
  // PLUS any article from other sources that mentions a competitor by name
  const competitorArticles = useMemo(() => {
    return articles.filter((a) => {
      if (a.sourceTag === "competitor") return true;
      const text = `${a.title} ${a.summary}`.toLowerCase();
      return COMPETITOR_NAMES.some((name) => text.includes(name));
    });
  }, [articles]);

  // YouTube suggestions: competitor moves, funding, product launches (good for video)
  const youtubeSuggestions = useMemo(() => {
    return articles
      .filter((a) => {
        const text = `${a.title}`.toLowerCase();
        return (
          a.sourceTag === "competitor" ||
          text.includes("launch") ||
          text.includes("raises") ||
          text.includes("funding") ||
          text.includes("announces") ||
          text.includes("new") ||
          text.includes("vs") ||
          a.sourceTag === "community"
        );
      })
      .slice(0, 10);
  }, [articles]);

  // Blog suggestions: industry trends, use cases, deep analysis
  const blogSuggestions = useMemo(() => {
    return articles
      .filter((a) => {
        const text = `${a.title}`.toLowerCase();
        return (
          a.sourceTag === "lead" ||
          a.category === "use-case" ||
          a.category === "cx" ||
          text.includes("how") ||
          text.includes("why") ||
          text.includes("guide") ||
          text.includes("trend") ||
          text.includes("report") ||
          text.includes("study")
        );
      })
      .slice(0, 10);
  }, [articles]);

  // Get articles for current feed section
  const sectionArticles = useMemo(() => {
    let result: Article[] = [];
    switch (activeSection) {
      case "feed":
        result = articles;
        break;
      case "lead-alerts":
        result = leadAlerts;
        break;
      case "competitor-watch":
        result = competitorArticles;
        break;
      default:
        result = [];
    }
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(lower) ||
          a.summary.toLowerCase().includes(lower)
      );
    }
    return result;
  }, [articles, leadAlerts, competitorArticles, activeSection, search]);

  // Content pipeline data from sheets
  const youtubeRows = useMemo(
    () => sheetRows.filter((r) => r.platform?.toLowerCase() === "youtube"),
    [sheetRows]
  );
  const blogRows = useMemo(
    () => sheetRows.filter((r) => r.platform?.toLowerCase() === "blog"),
    [sheetRows]
  );
  const editRows = useMemo(
    () => sheetRows.filter((r) => r.status === "saved" && !r.platform),
    [sheetRows]
  );

  // Sidebar counts
  const sidebarCounts = useMemo(
    () => ({
      feed: articles.length,
      "lead-alerts": leadAlerts.length,
      "competitor-watch": competitorArticles.length,
      youtube: youtubeRows.length || youtubeSuggestions.length,
      blogs: blogRows.length || blogSuggestions.length,
      edits: editRows.length,
    }),
    [
      articles, leadAlerts, competitorArticles,
      youtubeRows, blogRows, editRows,
      youtubeSuggestions, blogSuggestions,
    ]
  );

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  const isFeedSection =
    activeSection === "feed" ||
    activeSection === "lead-alerts" ||
    activeSection === "competitor-watch";

  const isContentSection =
    activeSection === "youtube" ||
    activeSection === "blogs" ||
    activeSection === "edits";

  const renderContent = () => {
    if (activeSection === "overview") {
      return (
        <Overview
          articles={articles}
          sheetRows={sheetRows}
          onNavigate={(section) => {
            setActiveSection(section);
            setSelectedArticle(null);
          }}
          onSelectArticle={setSelectedArticle}
        />
      );
    }

    if (isContentSection) {
      const rows =
        activeSection === "youtube"
          ? youtubeRows
          : activeSection === "blogs"
          ? blogRows
          : editRows;
      const suggestions =
        activeSection === "youtube"
          ? youtubeSuggestions
          : activeSection === "blogs"
          ? blogSuggestions
          : [];
      return (
        <ContentPipeline
          rows={rows}
          type={activeSection as "youtube" | "blogs" | "edits"}
          loading={sheetsLoading && loading}
          suggestions={suggestions}
          onSelectArticle={setSelectedArticle}
        />
      );
    }

    // Feed sections
    const sectionInfo = SECTION_TITLES[activeSection] || SECTION_TITLES.feed;

    return (
      <div className="flex-1 flex flex-col min-h-0">
        {/* Section header + search */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="flex-1 min-w-0">
            <h1 className="text-[15px] font-semibold text-gray-900">
              {sectionInfo.title}
            </h1>
            <p className="text-[12px] text-gray-400 mt-0.5">
              {sectionInfo.subtitle}
            </p>
          </div>

          <div className="relative w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search..."
              className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-8 py-1.5 text-[13px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:bg-white transition-colors"
            />
            {localSearch && (
              <button
                onClick={() => {
                  setLocalSearch("");
                  setSearch("");
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <span className="text-[12px] text-gray-400 tabular-nums shrink-0">
            {sectionArticles.length} articles
          </span>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-[12px] font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">
              {refreshing ? "Fetching..." : "Refresh"}
            </span>
          </button>
        </div>

        {/* Article list */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50">
          {loading ? (
            <div className="p-4 grid grid-cols-1 xl:grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : sectionArticles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-1">
              <p className="text-[14px] text-gray-500">No articles found</p>
              <p className="text-[13px] text-gray-400">
                {search
                  ? "Try a different search term"
                  : "No matching articles in the last 7 days. Try refreshing."}
              </p>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-1 xl:grid-cols-2 gap-3 content-start">
              {sectionArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  isSelected={selectedArticle?.id === article.id}
                  onClick={() =>
                    setSelectedArticle(
                      selectedArticle?.id === article.id ? null : article
                    )
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={(section) => {
          setActiveSection(section);
          setSelectedArticle(null);
          setSearch("");
          setLocalSearch("");
        }}
        counts={sidebarCounts}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {activeSection === "overview" || isContentSection ? (
          <div className="flex-1 overflow-y-auto bg-gray-50/50">
            {renderContent()}
          </div>
        ) : (
          renderContent()
        )}
      </main>

      {selectedArticle && (
        <ArticleDetail
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
          onSaved={() => fetchSheets()}
        />
      )}
    </div>
  );
}
