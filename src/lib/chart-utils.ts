import type { SearchResult } from "./db-notes";

/**
 * Generates chart colors with consistent opacity
 * @param count Number of colors needed
 * @param opacity Opacity value (0-1)
 * @returns Array of RGBA color strings
 */
export function generateChartColors(count: number, opacity: number = 0.6): string[] {
  // Base colors with good contrast
  const baseColors = [
    "79, 70, 229",   // Indigo
    "220, 38, 38",   // Red
    "16, 185, 129",  // Emerald
    "245, 158, 11",  // Amber
    "59, 130, 246",  // Blue
    "236, 72, 153",  // Pink
    "139, 92, 246",  // Purple
    "14, 165, 233",  // Sky
  ];

  return Array.from({ length: count }, (_, i) => {
    const color = baseColors[i % baseColors.length];
    return `rgba(${color}, ${opacity})`;
  });
}

/**
 * Extracts analytics data from search results
 * @param results Search result array
 * @returns Object with analytics data
 */
export function getSearchAnalytics(results: SearchResult[]) {
  if (!results.length) return null;

  // Convert scores to percentages (higher is better)
  const percentages = results.map(result => Math.round((1 / result.score) * 100));
  
  return {
    // Basic stats
    count: results.length,
    averageScore: percentages.reduce((sum, score) => sum + score, 0) / results.length,
    medianScore: percentages.sort((a, b) => a - b)[Math.floor(percentages.length / 2)],
    maxScore: Math.max(...percentages),
    minScore: Math.min(...percentages),
    
    // For charts
    percentages,
    titles: results.map(result => result.title),
    shortTitles: results.map(result => 
      result.title.substring(0, 15) + (result.title.length > 15 ? "..." : "")
    ),
    
    // Score grouping for distribution analysis
    distribution: {
      excellent: percentages.filter(score => score >= 90).length,
      good: percentages.filter(score => score >= 75 && score < 90).length,
      moderate: percentages.filter(score => score >= 50 && score < 75).length,
      low: percentages.filter(score => score < 50).length
    }
  };
}