import { Show } from "solid-js";
import type { SearchResult } from "~/lib/db-notes";
import { getSearchAnalytics } from "~/lib/chart-utils";

interface SearchInsightsProps {
  results: SearchResult[];
}

export default function SearchInsights(props: SearchInsightsProps) {
  const getInsightMessage = (score: number) => {
    if (score >= 90) return "Excellent matches! Your search is highly effective.";
    if (score >= 75) return "Good results. Try adding more specific terms for better matches.";
    if (score >= 50) return "Moderate matches. Consider refining your search keywords.";
    return "Low relevance. Try different search terms for better results.";
  };

  const getProgressBarColor = (score: number) => {
    if (score >= 90) return "bg-success";
    if (score >= 75) return "bg-info";
    if (score >= 50) return "bg-warning";
    return "bg-error";
  };

  return (
    <Show when={props.results.length > 0}>
      {() => {
        const analytics = getSearchAnalytics(props.results);
        if (!analytics) return null;

        return (
          <div class="mt-4 p-2 rounded-md bg-base-200 text-sm">
            <div class="flex justify-between items-center mb-1">
              <span>Overall Match Quality</span>
              <span>{Math.round(analytics.averageScore)}%</span>
            </div>

            {/* Progress bar representing average match quality */}
            <div class="w-full bg-base-300 rounded-full h-2.5 mb-2">
              <div 
                class={`h-2.5 rounded-full ${getProgressBarColor(analytics.averageScore)}`}
                style={{ width: `${analytics.averageScore}%` }}
              />
            </div>

            {/* Insight message based on avg score */}
            <p class="text-xs opacity-80 mt-1">
              {getInsightMessage(analytics.averageScore)}
            </p>

            {/* Distribution breakdown */}
            <div class="mt-2 grid grid-cols-4 gap-1 text-xs">
              <div class="text-center">
                <div class="font-semibold">{analytics.distribution.excellent}</div>
                <div class="opacity-70">Excellent</div>
              </div>
              <div class="text-center">
                <div class="font-semibold">{analytics.distribution.good}</div>
                <div class="opacity-70">Good</div>
              </div>
              <div class="text-center">
                <div class="font-semibold">{analytics.distribution.moderate}</div>
                <div class="opacity-70">Moderate</div>
              </div>
              <div class="text-center">
                <div class="font-semibold">{analytics.distribution.low}</div>
                <div class="opacity-70">Low</div>
              </div>
            </div>
          </div>
        );
      }}
    </Show>
  );
}