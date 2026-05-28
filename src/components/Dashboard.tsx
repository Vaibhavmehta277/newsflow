"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  CheckCircle2,
  Newspaper,
  Users,
  Clock,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import type { SheetRow } from "@/types";

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[12px] text-gray-500">{label}</span>
        <div className="p-2 rounded-lg bg-gray-50">
          <Icon className="w-3.5 h-3.5 text-gray-400" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [rows, setRows] = useState<SheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRows = async () => {
      try {
        const res = await fetch("/api/sheets");
        if (!res.ok) throw new Error("Failed to fetch");
        const { rows: data } = await res.json();
        setRows(data || []);
      } catch {
        setError("Could not load data from Google Sheets.");
      } finally {
        setLoading(false);
      }
    };
    fetchRows();
  }, []);

  const today = format(new Date(), "yyyy-MM-dd");
  const todayRows = rows.filter((r) => r.date.startsWith(today));
  const postedRows = rows.filter((r) => r.status === "posted");
  const savedRows = rows.filter((r) => r.status === "saved");

  const memberCounts: Record<string, number> = {};
  for (const row of rows) {
    if (row.assignedTo) {
      memberCounts[row.assignedTo] = (memberCounts[row.assignedTo] || 0) + 1;
    }
  }
  const topMember =
    Object.entries(memberCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-[14px] text-gray-500 mb-1">{error}</p>
          <p className="text-[13px] text-gray-400">
            Make sure your Google Sheets is configured correctly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">
          Team content activity overview
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Articles Today" value={todayRows.length} icon={Newspaper} />
        <StatCard label="Total Saved" value={savedRows.length} icon={FileText} />
        <StatCard label="Total Posted" value={postedRows.length} icon={CheckCircle2} />
        <StatCard label="Most Active" value={topMember.split(" ")[0]} icon={Users} />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-gray-400" />
          <h3 className="text-[14px] font-medium text-gray-900">
            Recent Activity
          </h3>
        </div>
        {rows.length === 0 ? (
          <p className="text-[13px] text-gray-400 text-center py-8">
            No activity yet. Start curating articles!
          </p>
        ) : (
          <div className="space-y-0">
            {rows.slice(0, 10).map((row, i) => {
              const statusStyles: Record<string, string> = {
                posted: "text-green-600 bg-green-50",
                saved: "text-gray-600 bg-gray-100",
                skipped: "text-gray-400 bg-gray-50",
              };
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0"
                >
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusStyles[row.status] || statusStyles.saved}`}
                  >
                    {row.status}
                  </span>
                  <p className="text-[13px] text-gray-700 truncate flex-1 min-w-0">
                    {row.title}
                  </p>
                  <span className="text-[12px] text-gray-400 shrink-0">
                    {row.assignedTo}
                  </span>
                  {row.url && (
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-600 shrink-0"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
