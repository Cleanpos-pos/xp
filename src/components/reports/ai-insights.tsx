// File: src/components/reports/ai-insights.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getLatestAiInsight, type AiInsightData } from "@/app/(app)/reports/actions";

export function AiInsights() {
  const [data, setData] = useState<AiInsightData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const insight = await getLatestAiInsight();
        setData(insight);
      } catch (err) {
        console.error("Failed to load AI insights", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <Card className="border-indigo-100 bg-indigo-50/30">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-500" /> AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No analysis data available yet. Check back later.</p>
        </CardContent>
      </Card>
    );
  }

  const isPositiveGrowth = (data.revenue_change_percentage || 0) >= 0;

  return (
    <Card className="border-indigo-100 bg-gradient-to-br from-white to-indigo-50/50 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-indigo-900">
          <Sparkles className="h-5 w-5 text-indigo-600 fill-indigo-100" />
          AI Business Analysis
        </CardTitle>
        <CardDescription>
          Automated insights based on your recent activity (Last 30 Days)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Main Summary Section */}
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h4 className="font-semibold text-sm mb-2 text-indigo-950">Executive Summary</h4>
          <p className="text-sm text-slate-600 leading-relaxed">
            {data.summary_text || "No summary available."}
          </p>
        </div>

        {/* 3-Column Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* 1. Trending Items */}
          <div className="p-3 bg-white rounded-lg border border-indigo-100">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Trending Now</span>
            </div>
            <ul className="space-y-1">
              {data.trending_services.length > 0 ? (
                data.trending_services.map((item, idx) => (
                  <li key={idx} className="text-sm font-medium text-slate-700 flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2" />
                    {item}
                  </li>
                ))
              ) : (
                <li className="text-xs text-muted-foreground">No trending data</li>
              )}
            </ul>
          </div>

          {/* 2. Revenue Forecast */}
          <div className="p-3 bg-white rounded-lg border border-indigo-100">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Forecast (Next 30d)</span>
            </div>
            <div className="mt-1">
              <span className="text-2xl font-bold text-slate-800">
                £{data.revenue_forecast?.toLocaleString() ?? "0.00"}
              </span>
              {data.revenue_change_percentage !== null && (
                <div className={`flex items-center text-xs mt-1 font-medium ${isPositiveGrowth ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {isPositiveGrowth ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                  {Math.abs(data.revenue_change_percentage)}% vs last month
                </div>
              )}
            </div>
          </div>

          {/* 3. Action Items / Warnings */}
          <div className="p-3 bg-white rounded-lg border border-amber-100 bg-amber-50/30">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-800/70">Attention Needed</span>
            </div>
            <ul className="space-y-2">
              {data.actionable_tips.length > 0 ? (
                data.actionable_tips.map((tip, idx) => (
                  <li key={idx} className="text-xs text-slate-700 leading-snug flex gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    {tip}
                  </li>
                ))
              ) : (
                <li className="text-xs text-muted-foreground">No warnings at this time.</li>
              )}
            </ul>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
