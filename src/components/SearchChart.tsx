import { createEffect, onCleanup, onMount } from "solid-js";
import Chart from "chart.js/auto";
import type { SearchResult } from "~/lib/db/types/response";
import { generateChartColors, getSearchAnalytics } from "~/lib/chart-utils";
import Card from "./Card";

interface SearchChartProps {
  results: SearchResult[];
}

export default function SearchChart(props: SearchChartProps) {
  let chartContainer: HTMLCanvasElement | undefined;
  let chart: Chart | undefined;

  const createChart = () => {
    if (!chartContainer || props.results.length === 0) return;

    const analytics = getSearchAnalytics(props.results);
    if (!analytics) return;

    // Clean up existing chart if it exists
    if (chart) {
      chart.destroy();
    }

    chart = new Chart(chartContainer, {
      type: "bar",
      data: {
        labels: analytics.shortTitles,
        datasets: [
          {
            label: "Match Relevance (%)",
            data: analytics.percentages,
            backgroundColor: generateChartColors(analytics.count),
            borderColor: generateChartColors(analytics.count, 1),
            borderWidth: 1,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: "Match Relevance (%)",
            },
          },
        },
        plugins: {
          title: {
            display: true,
            text: "Search Result Relevance",
            font: {
              size: 16,
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.formattedValue}% match`,
            },
          },
        },
      },
    });
  };

  onMount(() => {
    createChart();
  });

  createEffect(() => {
    // Watch for changes in results
    props.results;
    createChart();
  });

  onCleanup(() => {
    if (chart) {
      chart.destroy();
    }
  });

  return (
    <Card
      variant="insights"
      padding="sm"
      title="Search Visualization"
      class="mt-4"
      style={{ display: props.results.length > 0 ? "block" : "none" }}
    >
      <div>
        <canvas
          ref={chartContainer}
          style={{ height: `${Math.min(props.results.length * 30, 300)}px` }}
        />
      </div>
    </Card>
  );
}
