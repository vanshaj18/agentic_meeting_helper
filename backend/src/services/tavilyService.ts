import { tavily } from '@tavily/core';
require('dotenv').config();

const apiKey = process.env.TAVILY_API_KEY || '';
if (!apiKey) {
  console.warn('⚠️  Warning: TAVILY_API_KEY not set. Web search features will not work.');
  console.warn('   Please set TAVILY_API_KEY in your .env file to enable web search features.');
} else {
  console.log('✅ Tavily API key configured successfully');
}

const RATE_LIMIT_RPM = 100; // Requests per minute
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute in milliseconds
const CREDIT_LIMIT = 1000; // Total API credits limit
const CREDITS_PER_BASIC_SEARCH = 1; // Basic search costs 1 credit per request

/**
 * Service for web search using Tavily API with rate limiting and credit tracking
 */
export class TavilyService {
  private client: ReturnType<typeof tavily>;
  private requestTimestamps: number[] = [];
  private creditsUsed: number = 0; // Track total credits consumed

  constructor() {
    if (!apiKey) {
      console.warn('⚠️  TavilyService initialized without API key. Web search operations will fail.');
    }
    this.client = tavily({ apiKey });
  }

  /**
   * Check if we're within the rate limit
   * @returns true if within rate limit, false otherwise
   */
  private checkRateLimit(): boolean {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW_MS;

    // Remove requests outside the current window
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => timestamp > windowStart
    );

    // Check if we're within the limit
    return this.requestTimestamps.length < RATE_LIMIT_RPM;
  }

  /**
   * Record a request timestamp
   */
  private recordRequest(): void {
    this.requestTimestamps.push(Date.now());
  }

  /**
   * Get the number of requests remaining in the current window
   */
  getRemainingRequests(): number {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW_MS;

    // Remove requests outside the current window
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => timestamp > windowStart
    );

    return Math.max(0, RATE_LIMIT_RPM - this.requestTimestamps.length);
  }

  /**
   * Check if we have enough credits for a request
   * @param creditsRequired - Number of credits required for the request
   * @returns true if enough credits available, false otherwise
   */
  private checkCreditLimit(creditsRequired: number): boolean {
    return (this.creditsUsed + creditsRequired) <= CREDIT_LIMIT;
  }

  /**
   * Record credits used
   * @param credits - Number of credits to deduct
   */
  private recordCredits(credits: number): void {
    this.creditsUsed += credits;
  }

  /**
   * Get remaining credits
   * @returns Number of credits remaining
   */
  getRemainingCredits(): number {
    return Math.max(0, CREDIT_LIMIT - this.creditsUsed);
  }

  /**
   * Get total credits used
   * @returns Number of credits used
   */
  getCreditsUsed(): number {
    return this.creditsUsed;
  }

  /**
   * Reset credits (useful for testing or monthly reset)
   */
  resetCredits(): void {
    this.creditsUsed = 0;
  }

  /**
   * Search the web using Tavily API with rate limiting and credit tracking
   * @param query - The search query
   * @returns Formatted search results as a string for LLM context
   * @throws Error if rate limit or credit limit is exceeded
   */
  async searchWeb(query: string): Promise<string> {
    try {
      if (!apiKey) {
        return '';
      }

      // Check credit limit before making request
      if (!this.checkCreditLimit(CREDITS_PER_BASIC_SEARCH)) {
        const remaining = this.getRemainingCredits();
        const errorMessage = `Credit limit exceeded. Tavily API credit limit is ${CREDIT_LIMIT} credits. You have ${remaining} credits remaining. Please upgrade your plan or wait for credit reset.`;
        console.warn(`⚠️  ${errorMessage} (Used: ${this.creditsUsed}/${CREDIT_LIMIT})`);
        throw new Error(errorMessage);
      }

      // Check rate limit before making request
      if (!this.checkRateLimit()) {
        const remaining = this.getRemainingRequests();
        const errorMessage = `Rate limit exceeded. Tavily API allows ${RATE_LIMIT_RPM} requests per minute. Please try again later.`;
        console.warn(`⚠️  ${errorMessage} (Remaining: ${remaining})`);
        throw new Error(errorMessage);
      }

      // Record the request
      this.recordRequest();

      const response = await this.client.search(query, {
        maxResults: 5, // Limit to top 5 results
        searchDepth: 'basic', // Use basic search for faster results (costs 1 credit)
        includeAnswer: true, // Include AI-generated answer
      });

      // Record credits used after successful request
      this.recordCredits(CREDITS_PER_BASIC_SEARCH);
      console.log(`✅ Tavily search completed. Credits used: ${this.creditsUsed}/${CREDIT_LIMIT} (Remaining: ${this.getRemainingCredits()})`);

      if (!response.results || response.results.length === 0) {
        return '';
      }

      // Format results for LLM context - only extract content field
      let formattedResults = 'Web Search Results:\n\n';
      
      // Include AI-generated answer if available
      if (response.answer) {
        formattedResults += `Summary: ${response.answer}\n\n`;
      }

      // Extract only content from each result (ignore url, raw_content, title)
      const contentList: string[] = [];
      response.results.forEach((result) => {
        if (result.content && result.content.trim()) {
          contentList.push(result.content.trim());
        }
      });

      if (contentList.length > 0) {
        formattedResults += contentList.join('\n\n');
      }

      return formattedResults;
    } catch (error: any) {
      // Re-throw rate limit and credit limit errors so they can be handled properly
      if (error.message && (
        error.message.includes('Rate limit exceeded') ||
        error.message.includes('Credit limit exceeded')
      )) {
        throw error;
      }
      console.error('Error searching web with Tavily:', error);
      return '';
    }
  }
}

export const tavilyService = new TavilyService();
