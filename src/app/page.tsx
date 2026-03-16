"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import FilterBar from "@/components/FilterBar";
import ArticleCard from "@/components/ArticleCard";
import ArticleSidePanel from "@/components/ArticleSidePanel";
import VideoCard from "@/components/VideoCard";
import VideoSidePanel from "@/components/VideoSidePanel";
import type { Article, ArticleCategory, VideoItem } from "@/types";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // ── RSS feed state ────────────────────────────────────────────────────────
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<string>();
  const [activeCategory, setActiveCategory] = useState<ArticleCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // ── YouTube state ─────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<"feed" | "youtube">("feed");
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoRefreshing, setVideoRefreshing] = useState(false);
  const [videoFetchedAt, setVideoFetchedAt] = useState<string>();
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // ── Fetch RSS articles ────────────────────────────────────────────────────
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
        setArticles(data.articles ?? []);
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
    if (status === "authenticated") fetchArticles();
  }, [status, fetchArticles]);

  // ── Fetch YouTube videos ──────────────────────────────────────────────────
  const fetchVideos = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) setVideoRefreshing(true);
    else setVideoLoading(true);
    try {
      const params = new URLSearchParams();
      if (forceRefresh) params.set("refresh", "true");

      const res = await fetch(`/api/youtube?${params}`);
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      setVideos(data.videos ?? []);
      setVideoFetchedAt(data.fetchedAt);
    } catch (err) {
      console.error("Failed to fetch YouTube videos:", err);
    } finally {
      setVideoLoading(false);
      setVideoRefreshing(false);
    }
  }, []);

  // Lazy-load videos the first time the user switches to the YouTube tab
  useEffect(() => {
    if (status === "authenticated" && viewMode === "youtube" && videos.length === 0) {
      fetchVideos();
    }
  }, [status, viewMode, videos.length, fetchVideos]);

  // ── Sidebar helpers ───────────────────────────────────────────────────────
  const handleViewModeChange = (mode: "feed" | "youtube") => {
    setViewMode(mode);
    setSelectedArticle(null);
    setSelectedVideo(null);
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const categoryCounts: Partial<Record<ArticleCategory | "all", number>> = {
    all: articles.length,
  };
  for (const a of articles) {
    categoryCounts[a.category] = (categoryCounts[a.category] ?? 0) + 1;
  }

  const filteredVideos = search
    ? videos.filter((v) => {
        const q = search.toLowerCase();
        return (
          v.title.toLowerCase().includes(q) ||
          v.channelName.toLowerCase().includes(q) ||
          v.description.toLowerCase().includes(q) ||
          v.searchKeyword.toLowerCase().includes(q)
        );
      })
    : videos;

  // ── Loading / auth gate ───────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <div className="w-6 h-6 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  const isYouTube = viewMode === "youtube";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-base)]">

      {/* Sidebar */}
      <Sidebar
        activeCategory={activeCategory}
        onCategoryChange={(cat) => {
          setActiveCategory(cat);
          setSelectedArticle(null);
        }}
        counts={categoryCounts}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        videoCount={videos.length}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Filter bar */}
        <FilterBar
          search={search}
          onSearchChange={(val) => {
            setSearch(val);
            if (isYouTube) setSelectedVideo(null);
            else setSelectedArticle(null);
          }}
          onRefresh={() => (isYouTube ? fetchVideos(true) : fetchArticles(true))}
          isRefreshing={isYouTube ? videoRefreshing : refreshing}
          articleCount={isYouTube ? filteredVideos.length : articles.length}
          fetchedAt={isYouTube ? videoFetchedAt : fetchedAt}
        />

        {/* Content grid */}
        <div className="flex-1 overflow-y-auto">
          {isYouTube ? (
            videoLoading ? (
              <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-[6px] bg-[var(--bg-surface)] border border-[var(--border)] overflow-hidden animate-pulse">
                    <div className="w-full aspect-video bg-[var(--bg-elevated)]" />
                    <div className="p-3.5 space-y-2">
                      <div className="h-3 bg-[var(--bg-elevated)] rounded-[4px] w-3/4" />
                      <div className="h-3 bg-[var(--bg-elevated)] rounded-[4px] w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-2">
                <p className="text-sm text-[var(--text-secondary)]">No videos found</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {search
                    ? "Try a different search term"
                    : "Add YOUTUBE_API_KEY to .env.local and restart"}
                </p>
              </div>
            ) : (
              <div className="p-4 grid grid-cols-1 xl:grid-cols-2 gap-3 content-start">
                {filteredVideos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    isSelected={selectedVideo?.id === video.id}
                    onClick={() =>
                      setSelectedVideo(
                        selectedVideo?.id === video.id ? null : video
                      )
                    }
                  />
                ))}
              </div>
            )
          ) : (
            loading ? (
              <div className="p-4 grid grid-cols-1 xl:grid-cols-2 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-[6px] bg-[var(--bg-surface)] border border-[var(--border)] p-4 animate-pulse space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--bg-elevated)]" />
                      <div className="h-2.5 bg-[var(--bg-elevated)] rounded-[4px] w-24" />
                      <div className="ml-auto h-2.5 bg-[var(--bg-elevated)] rounded-[4px] w-16" />
                    </div>
                    <div className="h-4 bg-[var(--bg-elevated)] rounded-[4px] w-full" />
                    <div className="h-4 bg-[var(--bg-elevated)] rounded-[4px] w-2/3" />
                    <div className="h-3 bg-[var(--bg-elevated)] rounded-[4px] w-full" />
                    <div className="h-3 bg-[var(--bg-elevated)] rounded-[4px] w-4/5" />
                  </div>
                ))}
              </div>
            ) : articles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-2">
                <p className="text-sm text-[var(--text-secondary)]">No articles found</p>
                <p className="text-xs text-[var(--text-muted)]">
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
            )
          )}
        </div>
      </main>

      {/* Side panels */}
      {!isYouTube && selectedArticle && (
        <ArticleSidePanel
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}
      {isYouTube && selectedVideo && (
        <VideoSidePanel
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </div>
  );
}
