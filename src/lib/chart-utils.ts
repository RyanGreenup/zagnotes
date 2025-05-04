import type { SearchResult } from "./db/types/response";

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
 * Calculates the relevance percentage from a BM25 score
 * @param score BM25 score from SQLite FTS5 (usually negative)
 * @returns Relevance percentage (0-100)
 */
export function calculateRelevancePercentage(score: number): number {
  // Handle negative scores from BM25 (lower negative values = better match)
  if (score < 0) {
    // Convert the negative scores to a 0-100 scale
    // Lower negative scores (-9) are better than higher negative scores (-15)
    // Typically BM25 scores range from about -15 to -5 for good matches
    
    // Map typical range (-15 to -5) to a percentage (0% to 100%)
    const minScore = -15; // Worst expected score
    const maxScore = -5;  // Best expected score
    
    // Clamp the score to our expected range
    const clampedScore = Math.max(minScore, Math.min(maxScore, score));
    
    // Map to percentage (higher = better)
    const percentage = ((clampedScore - minScore) / (maxScore - minScore)) * 100;
    return Math.round(percentage);
  } 
  
  // Handle positive scores (which are rare in BM25 but possible)
  // For positive scores, lower is still better in BM25
  else if (score > 0) {
    // Map from 0-5 range to 0-100% (5 being worst match, 0 being perfect)
    const percentage = Math.max(0, 100 - (score * 20));
    return Math.round(percentage);
  }
  
  // Handle exactly 0 score - treat as perfect match
  return 100;
}

/**
 * Extracts analytics data from search results
 * @param results Search result array
 * @returns Object with analytics data
 */
export function getSearchAnalytics(results: SearchResult[]) {
  if (!results.length) return null;

  // Convert BM25 scores to relevance percentages (0-100)
  const percentages = results.map(result => calculateRelevancePercentage(result.score));
  
  return {
    // Basic stats
    count: results.length,
    averageScore: percentages.reduce((sum, score) => sum + score, 0) / results.length,
    medianScore: [...percentages].sort((a, b) => a - b)[Math.floor(percentages.length / 2)],
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