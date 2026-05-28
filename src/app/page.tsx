"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import FilterBar from "@/components/FilterBar";
import ArticleCard from "@/components/ArticleCard";
import ArticleSidePanel from "@/components/ArticleSidePanel";
import type { Article, ArticleCategory } from "@/types";

function SkeletonCard() {
  return (
    <div className="p-4 rounded-xl border border-gray-200 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-3 w-20 bg-gray-100 rounded" />
        <div className="h-3 w-12 bg-gray-100 rounded" />
      </div>
      <div className="h-4 w-full bg-gray-100 rounded mb-2" />
      <div className="h-4 w-3/4 bg-gray-100 rounded mb-3" />
      <div className="h-3 w-full bg-gray-50 rounded mb-1" />
      <div className="h-3 w-2/3 bg-gray-50 rounded" />
    </div>
  );
}

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
    []
  );

  useEffect(() => {
    if (status === "authenticated") {
      fetchArticles();
    }
  }, [status, fetchArticles]);

  const filteredArticles = useMemo(() => {
    let result = articles;
    if (activeCategory !== "all") {
      result = result.filter((a) => a.category === activeCategory);
    }
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(lower) ||
          a.summary.toLowerCase().includes(lower) ||
          a.keywords.some((k) => k.toLowerCase().includes(lower))
      );
    }
    return result;
  }, [articles, activeCategory, search]);

  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<ArticleCategory | "all", number>> = {
      all: articles.length,
    };
    for (const a of articles) {
      counts[a.category] = (counts[a.category] || 0) + 1;
    }
    return counts;
  }, [articles]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar
        activeCategory={activeCategory}
        onCategoryChange={(cat) => {
          setActiveCategory(cat);
          setSelectedArticle(null);
        }}
        counts={categoryCounts}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          onRefresh={() => fetchArticles(true)}
          isRefreshing={refreshing}
          articleCount={filteredArticles.length}
          fetchedAt={fetchedAt}
        />

        <div className="flex-1 overflow-y-auto bg-gray-50/50">
          {loading ? (
            <div className="p-4 grid grid-cols-1 xl:grid-cols-2 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-1">
              <p className="text-[14px] text-gray-500">No articles found</p>
              <p className="text-[13px] text-gray-400">
                {search ? "Try a different search term" : "Check your RSS feed configuration"}
              </p>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-1 xl:grid-cols-2 gap-3 content-start">
              {filteredArticles.map((article) => (
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

      {selectedArticle && (
        <ArticleSidePanel
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}
    </div>
  );
}
