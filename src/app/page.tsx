"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import FilterBar from "@/components/FilterBar";
import ArticleCard from "@/components/ArticleCard";
import ArticleSidePanel from "@/components/ArticleSidePanel";
import type { Article, ArticleCategory } from "@/types";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<string>();
  const [activeCategory, setActiveCategory] = useState<ArticleCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchArticles = useCallback(
    async (forceRefresh = false) => {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const params = new URLSearchParams();
        if (activeCategory !== "all") params.set("category", activeCategory);
        if (search) params.set("search", search);
        if (forceRefresh) params.set("refresh", "true");

        const res = await fetch(`/api/feeds?${params}`);
        if (!res.ok) throw new Error("Fetch failed");
        const data = await res.json();
        setArticles(data.articles || []);
        setFetchedAt(data.fetchedAt);
      } catch (err) {
        console.error("Failed to fetch feeds:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeCategory, search]
  );

  useEffect(() => {
    if (status === "authenticated") {
      fetchArticles();
    }
  }, [status, fetchArticles]);

  // Category counts
  const categoryCounts: Partial<Record<ArticleCategory | "all", number>> = {
    all: articles.length,
  };
  // Pre-fetch all for counts (would need a separate call; using current articles as proxy)
  for (const a of articles) {
    categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1;
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[#09090b]">
      {/* Sidebar */}
      <Sidebar
        activeCategory={activeCategory}
        onCategoryChange={(cat) => {
          setActiveCategory(cat);
          setSelectedArticle(null);
        }}
        counts={categoryCounts}
      />

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          onRefresh={() => fetchArticles(true)}
          isRefreshing={refreshing}
          articleCount={articles.length}
          fetchedAt={fetchedAt}
        />

        {/* Article grid */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-zinc-500">Fetching latest articles...</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-2">
              <p className="text-sm text-zinc-400">No articles found</p>
              <p className="text-xs text-zinc-600">
                {search
                  ? "Try a different search term"
                  : "Check your RSS feed configuration"}
              </p>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-1 xl:grid-cols-2 gap-3 content-start">
              {articles.map((article) => (
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
      </main>

      {/* Side panel */}
      {selectedArticle && (
        <ArticleSidePanel
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}
    </div>
  );
}
