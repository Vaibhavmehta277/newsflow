"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Mail,
  RefreshCw,
  Copy,
  CheckCheck,
  FileText,
  Code2,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import type { Newsletter } from "@/types";

export default function NewsletterPreview() {
  const { status } = useSession();
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [selected, setSelected] = useState<Newsletter | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [copyMode, setCopyMode] = useState<"text" | "html">("text");
  const [copied, setCopied] = useState(false);
  const [showHtml, setShowHtml] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/newsletter");
      if (!res.ok) throw new Error();
      const json = await res.json();
      const list: Newsletter[] = json.newsletters || [];
      setNewsletters(list);
      if (list.length > 0 && !selected) {
        setSelected(list[0]);
      }
    } catch {
      // empty history is fine
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => {
    if (status === "authenticated") fetchHistory();
  }, [status, fetchHistory]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/newsletter", { method: "POST" });
      if (!res.ok) throw new Error("Generation failed");
      const json = await res.json();
      const newsletter: Newsletter = json.newsletter;
      setNewsletters((prev) => [newsletter, ...prev]);
      setSelected(newsletter);
    } catch {
      setError("Failed to generate newsletter. Check your API key.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!selected) return;
    const text = copyMode === "html" ? selected.htmlContent : selected.plainText;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="flex h-full">
      {/* Left sidebar: history */}
      <div className="w-56 shrink-0 h-full flex flex-col bg-[var(--bg-surface)] border-r border-[var(--border)] overflow-y-auto">
        <div className="px-4 py-4 border-b border-[var(--border)]">
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
            History
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-[6px] bg-[var(--accent)] hover:opacity-90 text-white text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Mail className="w-3.5 h-3.5" />
                New Newsletter
              </>
            )}
          </button>
          {error && (
            <div className="flex items-center gap-1 mt-2 text-[10px] text-[var(--red)]">
              <AlertCircle className="w-3 h-3" />
              {error}
            </div>
          )}
        </div>

        <div className="flex-1 py-2">
          {loading && (
            <div className="px-4 py-4 space-y-2 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 bg-[var(--bg-elevated)] rounded-[4px]" />
              ))}
            </div>
          )}
          {!loading && newsletters.length === 0 && (
            <p className="px-4 py-4 text-[11px] text-[var(--text-muted)] text-center leading-relaxed">
              No newsletters yet.
              <br />
              Click &ldquo;New Newsletter&rdquo; to generate your first one.
            </p>
          )}
          {newsletters.map((n) => (
            <button
              key={n.id}
              onClick={() => setSelected(n)}
              className={`w-full text-left px-4 py-3 border-b border-[var(--border)] transition-colors ${
                selected?.id === n.id
                  ? "bg-[var(--accent-subtle)] border-l-2 border-l-[var(--accent)]"
                  : "hover:bg-[var(--bg-hover)]"
              }`}
            >
              <p className="text-xs font-medium text-[var(--text-secondary)] line-clamp-2 leading-snug mb-1">
                {n.subject}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                <Clock className="w-2.5 h-2.5" />
                {format(new Date(n.generatedAt), "MMM d, h:mm a")}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main preview area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
            <div className="w-12 h-12 rounded-[6px] bg-[var(--accent-subtle)] border border-[var(--accent-border)] flex items-center justify-center">
              <Mail className="w-6 h-6 text-[var(--accent)]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">
                No newsletter selected
              </p>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Generate a weekly newsletter from your current feed content,
                YouTube videos, and competitor intelligence.
              </p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 rounded-[6px] bg-[var(--accent)] hover:opacity-90 text-white text-sm font-medium transition-all disabled:opacity-50"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
              {generating ? "Generating…" : "Generate Newsletter"}
            </button>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-[var(--border)] shrink-0 bg-[var(--bg-surface)]">
              <div>
                <h1 className="text-sm font-semibold text-[var(--text-primary)] line-clamp-1">
                  {selected.subject}
                </h1>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Week of {selected.weekOf} · Generated{" "}
                  {format(new Date(selected.generatedAt), "MMM d, h:mm a")}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] border border-[var(--border)] transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} />
                  Regenerate
                </button>

                {/* Copy mode toggle */}
                <div className="flex rounded-[4px] border border-[var(--border)] overflow-hidden">
                  <button
                    onClick={() => setCopyMode("text")}
                    className={`flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors ${
                      copyMode === "text"
                        ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                        : "bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                    }`}
                  >
                    <FileText className="w-3 h-3" />
                    Text
                  </button>
                  <button
                    onClick={() => setCopyMode("html")}
                    className={`flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors ${
                      copyMode === "html"
                        ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                        : "bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                    }`}
                  >
                    <Code2 className="w-3 h-3" />
                    HTML
                  </button>
                </div>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[var(--accent)] hover:opacity-90 text-white text-xs font-medium transition-all"
                >
                  {copied ? (
                    <>
                      <CheckCheck className="w-3.5 h-3.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy {copyMode === "html" ? "HTML" : "Text"}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Preview content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* Subject / Preview */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[6px] p-4">
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Subject Line
                  </p>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {selected.subject}
                  </p>
                </div>
                <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[6px] p-4">
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Preview Text
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">{selected.previewText}</p>
                </div>
              </div>

              {/* Intro */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[6px] p-4">
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2">
                  Intro
                </p>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {selected.intro}
                </p>
              </div>

              {/* Articles */}
              {selected.articles.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[var(--text-secondary)] mb-3 flex items-center gap-2">
                    Top Stories
                    <span className="text-[10px] text-[var(--text-muted)] font-normal">
                      {selected.articles.length} articles
                    </span>
                  </p>
                  <div className="space-y-2">
                    {selected.articles.map((a, i) => (
                      <div
                        key={i}
                        className="flex gap-3 p-3 rounded-[6px] bg-[var(--bg-surface)] border border-[var(--border)]"
                      >
                        <span className="text-xs text-[var(--text-muted)] shrink-0 pt-0.5">
                          {i + 1}.
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[var(--text-primary)] leading-snug mb-0.5">
                            {a.title}
                          </p>
                          <p className="text-[11px] text-[var(--text-muted)] mb-1">
                            {a.source}
                          </p>
                          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                            {a.summary}
                          </p>
                        </div>
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors shrink-0 mt-0.5"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Videos */}
              {selected.videos.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[var(--text-secondary)] mb-3 flex items-center gap-2">
                    Watch This Week
                    <span className="text-[10px] text-[var(--text-muted)] font-normal">
                      {selected.videos.length} videos
                    </span>
                  </p>
                  <div className="space-y-2">
                    {selected.videos.map((v, i) => (
                      <div
                        key={i}
                        className="flex gap-3 p-3 rounded-[6px] bg-[var(--bg-surface)] border border-[var(--border)]"
                      >
                        <span className="text-xs text-[var(--text-muted)] shrink-0 pt-0.5">
                          {i + 1}.
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[var(--text-primary)] leading-snug mb-0.5">
                            {v.title}
                          </p>
                          <p className="text-[11px] text-[var(--text-muted)] mb-1">
                            {v.channel}
                          </p>
                          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                            {v.summary}
                          </p>
                        </div>
                        <a
                          href={v.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--text-muted)] hover:text-red-400 transition-colors shrink-0 mt-0.5"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Competitor Watch */}
              {selected.competitorWatch.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[var(--text-secondary)] mb-3">
                    Competitor Watch
                  </p>
                  <div className="space-y-2">
                    {selected.competitorWatch.map((c, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-[6px] bg-[var(--amber-subtle)] border border-[var(--amber)]"
                      >
                        <span className="text-[10px] px-2 py-0.5 rounded-[4px] bg-[var(--amber-subtle)] text-[var(--amber)] border border-[var(--amber)] font-medium">
                          {c.competitor}
                        </span>
                        <p className="text-[11px] text-[var(--text-secondary)] mt-2 leading-relaxed">
                          {c.insight}
                        </p>
                        <p className="text-[11px] text-[var(--green)] mt-1 italic">
                          {c.opportunity}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Market Signal */}
              <div className="p-4 rounded-[6px] bg-[var(--green-subtle)] border border-[var(--green)]">
                <p className="text-[10px] font-semibold text-[var(--green)] uppercase tracking-wider mb-2">
                  Market Signal
                </p>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {selected.marketSignal}
                </p>
              </div>

              {/* CTA */}
              <div className="p-4 rounded-[6px] bg-[var(--accent-subtle)] border border-[var(--accent-border)] text-center">
                <p className="text-xs text-[var(--text-secondary)] italic mb-3">{selected.cta}</p>
                <span className="text-[11px] px-3 py-1.5 rounded-[4px] bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent-border)]">
                  Book a Demo → smallest.ai
                </span>
              </div>

              {/* Raw HTML toggle */}
              <div>
                <button
                  onClick={() => setShowHtml((v) => !v)}
                  className="flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  {showHtml ? "Hide" : "Show"} HTML source
                  {showHtml ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
                {showHtml && (
                  <pre className="mt-3 p-4 rounded-[6px] bg-[var(--bg-base)] border border-[var(--border)] text-[10px] text-[var(--text-secondary)] overflow-x-auto leading-relaxed max-h-64">
                    {selected.htmlContent}
                  </pre>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
