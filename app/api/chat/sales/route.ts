import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText, convertToModelMessages, UIMessage, tool, stepCountIs } from "ai";
import { env } from "@/lib/env.mjs";
import { db } from "@/lib/db";
import { 
  bookUsage, journalUsage, bookDenials, journalDenials, 
  booksPurchased, journalSubscriptionsPrevYear 
} from "@/lib/db/schema";
import { eq, sql, desc, asc, and, or, like, gte, lte, between } from "drizzle-orm";
import z from "zod";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Sales AI Tools for RAG
const salesTools = {
  analyzeBookUsage: tool({
    description: "Analyze book usage data to identify trends and popular books. ALWAYS extract year and limit from user queries. Examples: 'top 5 books in 2024' → {limit: 5, year: '2024'}, 'most popular books in 2025' → {year: '2025'}, 'best 3 books' → {limit: 3}",
    inputSchema: z.object({
      title: z.string().optional().describe("Filter by book title (partial match)"),
      limit: z.number().optional().default(10).describe("Number of results to return. Extract from 'top 5', 'best 3', 'first 10', etc."),
      year: z.string().optional().describe("Filter by year. Extract from '2023', '2024', '2025', 'this year', 'last year', etc. Use '2025' for 'this year', '2024' for 'last year'"),
    }),
    execute: async ({ title, limit = 10, year }) => {
      console.log("🔧 [SALES TOOL] analyzeBookUsage called");
      console.log("📥 Input parameters:", { title, limit, year });
      console.log("⏰ Called at:", new Date().toISOString());
      console.log("─".repeat(50));
      try {
        // Define available months for each year (2025 only goes to August)
        const availableMonths = {
          "2023": ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"],
          "2024": ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"],
          "2025": ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug"] // Only to August
        };
        
        // Build the raw SQL query to avoid GROUP BY issues
        let selectClause = `
          SELECT 
            title, platform, publisher, yop, isbn,
        `;
        let fromClause = ` FROM book_usage `;
        let whereClause = ` WHERE 1=1 `;
        let orderClause = ` ORDER BY `;
        
        if (year && ["2023", "2024", "2025"].includes(year)) {
          // Single year analysis
          const months = availableMonths[year as keyof typeof availableMonths];
          const totalColumns = months.map(m => `COALESCE(${m}_${year}_total_item_requests, 0)`).join(' + ');
          const uniqueColumns = months.map(m => `COALESCE(${m}_${year}_unique_title_requests, 0)`).join(' + ');
          
          selectClause += `
            (${totalColumns}) as total_requests,
            (${uniqueColumns}) as unique_requests,
            '${year}' as analysis_year
          `;
          orderClause += ` (${totalColumns}) DESC `;
          whereClause += ` AND (${totalColumns}) > 0 `;
          
        } else if (!year) {
          // All years combined
          const allTotalColumns: string[] = [];
          const allUniqueColumns: string[] = [];
          
          Object.entries(availableMonths).forEach(([y, months]) => {
            months.forEach(month => {
              allTotalColumns.push(`COALESCE(${month}_${y}_total_item_requests, 0)`);
              allUniqueColumns.push(`COALESCE(${month}_${y}_unique_title_requests, 0)`);
            });
          });
          
          const totalColumns = allTotalColumns.join(' + ');
          const uniqueColumns = allUniqueColumns.join(' + ');
          
          selectClause += `
            (${totalColumns}) as total_requests,
            (${uniqueColumns}) as unique_requests,
            '2023-2025' as analysis_year
          `;
          orderClause += ` (${totalColumns}) DESC `;
          whereClause += ` AND (${totalColumns}) > 0 `;
          
        } else {
          return { error: `Invalid year: ${year}. Please use 2023, 2024, 2025, or leave empty for all years.` };
        }
        
        // Add title filter if provided
        if (title) {
          whereClause += ` AND title ILIKE '%${title.replace(/'/g, "''")}%' `;
        }
        
                // Build final query
                const finalQuery = selectClause + fromClause + whereClause + orderClause + ` LIMIT ${limit}`;
                
                // Log the SQL query being executed
                console.log("🔍 [SALES] analyzeBookUsage - SQL Query:");
                console.log("📊 Parameters:", { title, limit, year });
                console.log("🗃️ Query:", finalQuery);
                console.log("─".repeat(80));
                
                // Execute raw query
                const results = await db.execute(sql.raw(finalQuery));
                
                console.log("✅ [SALES] analyzeBookUsage - Query Results:");
                console.log("📈 Records returned:", results.length);
                console.log("🎯 Analysis year:", year || "2023-2025");
                if (results.length > 0) {
                  console.log("🏆 Top result:", results[0]);
                }
                console.log("─".repeat(80));
                
                return { 
                  books: results,
                  analysis_year: year || "2023-2025",
                  total_analyzed: results.length
                };
      } catch (error) {
        console.error("Error analyzing book usage:", error);
        return { 
          error: "I couldn't retrieve the book usage data at the moment. Please note that our data covers the period from January 2023 to August 2025. Please try rephrasing your query or specify a different time period.",
          data_period: "January 2023 - August 2025"
        };
      }
    },
  }),

  trackBookDenials: tool({
    description: "Track book access denials to identify high-demand books that users can't access. ALWAYS extract year from queries. Examples: 'denials in 2024' → {year: '2024'}, 'highest denial rates this year' → {year: '2025'}",
    inputSchema: z.object({
      limit: z.number().optional().default(10).describe("Number of denial records to return. Extract from 'top 5', 'first 3', etc."),
      year: z.string().optional().describe("Filter by year. Extract '2023', '2024', '2025' from user query. Use '2025' for 'this year'"),
    }),
    execute: async ({ limit = 10, year }) => {
      console.log("🔧 [SALES TOOL] trackBookDenials called");
      console.log("📥 Input parameters:", { limit, year });
      console.log("⏰ Called at:", new Date().toISOString());
      console.log("─".repeat(50));
      try {
        // Build raw SQL query for proper denial analysis sorted by total denials
        let selectClause = `
          SELECT 
            title, publisher, isbn, yop,
        `;
        let fromClause = ` FROM book_denials `;
        let whereClause = ` WHERE 1=1 `;
        let orderClause = ` ORDER BY `;
        
        let totalDenialsSQL: string;

        if (year && ["2023", "2024"].includes(year)) {
          // Single year analysis
          if (year === "2023") {
            totalDenialsSQL = `(COALESCE(jan_2023_no_license, 0) + COALESCE(feb_2023_no_license, 0) + 
              COALESCE(mar_2023_no_license, 0) + COALESCE(apr_2023_no_license, 0) + COALESCE(may_2023_no_license, 0) + 
              COALESCE(jun_2023_no_license, 0) + COALESCE(jul_2023_no_license, 0) + COALESCE(aug_2023_no_license, 0) + 
              COALESCE(sep_2023_no_license, 0) + COALESCE(oct_2023_no_license, 0) + COALESCE(nov_2023_no_license, 0) + 
              COALESCE(dec_2023_no_license, 0) + COALESCE(jan_2023_limit_exceeded, 0) + COALESCE(mar_2023_limit_exceeded, 0) + 
              COALESCE(apr_2023_limit_exceeded, 0) + COALESCE(may_2023_limit_exceeded, 0) + COALESCE(aug_2023_limit_exceeded, 0) + 
              COALESCE(sep_2023_limit_exceeded, 0))`;
          } else { // 2024
            totalDenialsSQL = `(COALESCE(jan_2024_no_license, 0) + COALESCE(feb_2024_no_license, 0) + 
              COALESCE(mar_2024_no_license, 0) + COALESCE(apr_2024_no_license, 0) + COALESCE(may_2024_no_license, 0) + 
              COALESCE(jun_2024_no_license, 0) + COALESCE(jul_2024_no_license, 0) + COALESCE(jan_2024_limit_exceeded, 0) + 
              COALESCE(mar_2024_limit_exceeded, 0) + COALESCE(apr_2024_limit_exceeded, 0) + COALESCE(may_2024_limit_exceeded, 0))`;
          }
          
          selectClause += `
            ${totalDenialsSQL} as total_denials,
            '${year}' as analysis_year
          `;
          orderClause += ` ${totalDenialsSQL} DESC `;
          whereClause += ` AND ${totalDenialsSQL} > 0 `;
          
        } else {
          // All years combined
          totalDenialsSQL = `(COALESCE(jan_2023_no_license, 0) + COALESCE(feb_2023_no_license, 0) + 
            COALESCE(mar_2023_no_license, 0) + COALESCE(apr_2023_no_license, 0) + COALESCE(may_2023_no_license, 0) + 
            COALESCE(jun_2023_no_license, 0) + COALESCE(jul_2023_no_license, 0) + COALESCE(aug_2023_no_license, 0) + 
            COALESCE(sep_2023_no_license, 0) + COALESCE(oct_2023_no_license, 0) + COALESCE(nov_2023_no_license, 0) + 
            COALESCE(dec_2023_no_license, 0) + COALESCE(jan_2023_limit_exceeded, 0) + COALESCE(mar_2023_limit_exceeded, 0) + 
            COALESCE(apr_2023_limit_exceeded, 0) + COALESCE(may_2023_limit_exceeded, 0) + COALESCE(aug_2023_limit_exceeded, 0) + 
            COALESCE(sep_2023_limit_exceeded, 0) + COALESCE(jan_2024_no_license, 0) + COALESCE(feb_2024_no_license, 0) + 
            COALESCE(mar_2024_no_license, 0) + COALESCE(apr_2024_no_license, 0) + COALESCE(may_2024_no_license, 0) + 
            COALESCE(jun_2024_no_license, 0) + COALESCE(jul_2024_no_license, 0) + COALESCE(jan_2024_limit_exceeded, 0) + 
            COALESCE(mar_2024_limit_exceeded, 0) + COALESCE(apr_2024_limit_exceeded, 0) + COALESCE(may_2024_limit_exceeded, 0))`;
          
          selectClause += `
            ${totalDenialsSQL} as total_denials,
            '2023-2024' as analysis_year
          `;
          orderClause += ` ${totalDenialsSQL} DESC `;
          whereClause += ` AND ${totalDenialsSQL} > 0 `;
        }
        
        // Build final query
        const finalQuery = selectClause + fromClause + whereClause + orderClause + ` LIMIT ${limit}`;
        
        // Log the SQL query being executed
        console.log("🔍 [SALES] trackBookDenials - SQL Query:");
        console.log("📊 Parameters:", { limit, year });
        console.log("🗃️ Query:", finalQuery);
        console.log("─".repeat(80));
        
        // Execute raw query
        const results = await db.execute(sql.raw(finalQuery));
        
        console.log("✅ [SALES] trackBookDenials - Query Results:");
        console.log("📈 Records returned:", results.length);
        console.log("🎯 Analysis year:", year || "2023-2024");
        if (results.length > 0) {
          console.log("🚫 Top denied book:", results[0]);
        }
        console.log("─".repeat(80));
        
        return { 
          deniedBooks: results,
          analysis_year: year || "2023-2024",
          total_analyzed: results.length
        };
      } catch (error) {
        console.error("Error tracking book denials:", error);
        return { 
          error: "I couldn't access the book denial data right now. Our denial tracking covers access attempts from 2023 to 2025. Please try again or contact support if the issue persists.",
          data_period: "2023 - 2025"
        };
      }
    },
  }),

  analyzeJournalUsage: tool({
    description: "Analyze journal usage data to identify popular journals and usage trends. Use this for journal performance analysis and subscription insights.",
    inputSchema: z.object({
      title: z.string().optional().describe("Filter by journal title (partial match)"),
      publisher: z.string().optional().describe("Filter by publisher"),
      limit: z.number().optional().default(10).describe("Number of results to return"),
      year: z.string().optional().describe("Filter by year (2023, 2024, 2025) or leave empty for all years"),
    }),
    execute: async ({ title, publisher, limit = 10, year }) => {
      console.log("🔧 [SALES TOOL] analyzeJournalUsage called");
      console.log("📥 Input parameters:", { title, publisher, limit, year });
      console.log("⏰ Called at:", new Date().toISOString());
      console.log("─".repeat(50));
      try {
        // Build raw SQL query for proper journal usage analysis sorted by usage totals
        let selectClause = `
          SELECT 
            title, publisher, online_issn, print_issn,
        `;
        let fromClause = ` FROM journal_usage `;
        let whereClause = ` WHERE 1=1 `;
        let orderClause = ` ORDER BY `;
        
        let totalUsageSQL: string;
        let uniqueUsageSQL: string;

        if (year && ["2023", "2024", "2025"].includes(year)) {
          // Single year analysis
          if (year === "2023") {
            totalUsageSQL = `(COALESCE(jan_2023_total_item_requests, 0) + COALESCE(feb_2023_total_item_requests, 0) + 
              COALESCE(mar_2023_total_item_requests, 0) + COALESCE(apr_2023_total_item_requests, 0) + 
              COALESCE(may_2023_total_item_requests, 0) + COALESCE(jun_2023_total_item_requests, 0) + 
              COALESCE(jul_2023_total_item_requests, 0) + COALESCE(aug_2023_total_item_requests, 0) + 
              COALESCE(sep_2023_total_item_requests, 0) + COALESCE(oct_2023_total_item_requests, 0) + 
              COALESCE(nov_2023_total_item_requests, 0) + COALESCE(dec_2023_total_item_requests, 0))`;
            uniqueUsageSQL = `(COALESCE(jan_2023_unique_item_requests, 0) + COALESCE(feb_2023_unique_item_requests, 0) + 
              COALESCE(mar_2023_unique_item_requests, 0) + COALESCE(apr_2023_unique_item_requests, 0) + 
              COALESCE(may_2023_unique_item_requests, 0) + COALESCE(jun_2023_unique_item_requests, 0) + 
              COALESCE(jul_2023_unique_item_requests, 0) + COALESCE(aug_2023_unique_item_requests, 0) + 
              COALESCE(sep_2023_unique_item_requests, 0) + COALESCE(oct_2023_unique_item_requests, 0) + 
              COALESCE(nov_2023_unique_item_requests, 0) + COALESCE(dec_2023_unique_item_requests, 0))`;
          } else if (year === "2024") {
            totalUsageSQL = `(COALESCE(jan_2024_total_item_requests, 0) + COALESCE(feb_2024_total_item_requests, 0) + 
              COALESCE(mar_2024_total_item_requests, 0) + COALESCE(apr_2024_total_item_requests, 0) + 
              COALESCE(may_2024_total_item_requests, 0) + COALESCE(jun_2024_total_item_requests, 0) + 
              COALESCE(jul_2024_total_item_requests, 0) + COALESCE(aug_2024_total_item_requests, 0) + 
              COALESCE(sep_2024_total_item_requests, 0) + COALESCE(oct_2024_total_item_requests, 0) + 
              COALESCE(nov_2024_total_item_requests, 0) + COALESCE(dec_2024_total_item_requests, 0))`;
            uniqueUsageSQL = `(COALESCE(jan_2024_unique_item_requests, 0) + COALESCE(feb_2024_unique_item_requests, 0) + 
              COALESCE(mar_2024_unique_item_requests, 0) + COALESCE(apr_2024_unique_item_requests, 0) + 
              COALESCE(may_2024_unique_item_requests, 0) + COALESCE(jun_2024_unique_item_requests, 0) + 
              COALESCE(jul_2024_unique_item_requests, 0) + COALESCE(aug_2024_unique_item_requests, 0) + 
              COALESCE(sep_2024_unique_item_requests, 0) + COALESCE(oct_2024_unique_item_requests, 0) + 
              COALESCE(nov_2024_unique_item_requests, 0) + COALESCE(dec_2024_unique_item_requests, 0))`;
          } else { // 2025
            totalUsageSQL = `(COALESCE(jan_2025_total_item_requests, 0) + COALESCE(feb_2025_total_item_requests, 0) + 
              COALESCE(mar_2025_total_item_requests, 0) + COALESCE(apr_2025_total_item_requests, 0) + 
              COALESCE(may_2025_total_item_requests, 0) + COALESCE(jun_2025_total_item_requests, 0))`;
            uniqueUsageSQL = `(COALESCE(jan_2025_unique_item_requests, 0) + COALESCE(feb_2025_unique_item_requests, 0) + 
              COALESCE(mar_2025_unique_item_requests, 0) + COALESCE(apr_2025_unique_item_requests, 0) + 
              COALESCE(may_2025_unique_item_requests, 0) + COALESCE(jun_2025_unique_item_requests, 0))`;
          }
          
          selectClause += `
            ${totalUsageSQL} as total_requests,
            ${uniqueUsageSQL} as unique_requests,
            '${year}' as analysis_year
          `;
          orderClause += ` ${totalUsageSQL} DESC `;
          whereClause += ` AND ${totalUsageSQL} > 0 `;
          
        } else {
          // All years combined
          totalUsageSQL = `(COALESCE(jan_2023_total_item_requests, 0) + COALESCE(feb_2023_total_item_requests, 0) + 
            COALESCE(mar_2023_total_item_requests, 0) + COALESCE(apr_2023_total_item_requests, 0) + 
            COALESCE(may_2023_total_item_requests, 0) + COALESCE(jun_2023_total_item_requests, 0) + 
            COALESCE(jul_2023_total_item_requests, 0) + COALESCE(aug_2023_total_item_requests, 0) + 
            COALESCE(sep_2023_total_item_requests, 0) + COALESCE(oct_2023_total_item_requests, 0) + 
            COALESCE(nov_2023_total_item_requests, 0) + COALESCE(dec_2023_total_item_requests, 0) + 
            COALESCE(jan_2024_total_item_requests, 0) + COALESCE(feb_2024_total_item_requests, 0) + 
            COALESCE(mar_2024_total_item_requests, 0) + COALESCE(apr_2024_total_item_requests, 0) + 
            COALESCE(may_2024_total_item_requests, 0) + COALESCE(jun_2024_total_item_requests, 0) + 
            COALESCE(jul_2024_total_item_requests, 0) + COALESCE(aug_2024_total_item_requests, 0) + 
            COALESCE(sep_2024_total_item_requests, 0) + COALESCE(oct_2024_total_item_requests, 0) + 
            COALESCE(nov_2024_total_item_requests, 0) + COALESCE(dec_2024_total_item_requests, 0) + 
            COALESCE(jan_2025_total_item_requests, 0) + COALESCE(feb_2025_total_item_requests, 0) + 
            COALESCE(mar_2025_total_item_requests, 0) + COALESCE(apr_2025_total_item_requests, 0) + 
            COALESCE(may_2025_total_item_requests, 0) + COALESCE(jun_2025_total_item_requests, 0))`;
          uniqueUsageSQL = `(COALESCE(jan_2023_unique_item_requests, 0) + COALESCE(feb_2023_unique_item_requests, 0) + 
            COALESCE(mar_2023_unique_item_requests, 0) + COALESCE(apr_2023_unique_item_requests, 0) + 
            COALESCE(may_2023_unique_item_requests, 0) + COALESCE(jun_2023_unique_item_requests, 0) + 
            COALESCE(jul_2023_unique_item_requests, 0) + COALESCE(aug_2023_unique_item_requests, 0) + 
            COALESCE(sep_2023_unique_item_requests, 0) + COALESCE(oct_2023_unique_item_requests, 0) + 
            COALESCE(nov_2023_unique_item_requests, 0) + COALESCE(dec_2023_unique_item_requests, 0) + 
            COALESCE(jan_2024_unique_item_requests, 0) + COALESCE(feb_2024_unique_item_requests, 0) + 
            COALESCE(mar_2024_unique_item_requests, 0) + COALESCE(apr_2024_unique_item_requests, 0) + 
            COALESCE(may_2024_unique_item_requests, 0) + COALESCE(jun_2024_unique_item_requests, 0) + 
            COALESCE(jul_2024_unique_item_requests, 0) + COALESCE(aug_2024_unique_item_requests, 0) + 
            COALESCE(sep_2024_unique_item_requests, 0) + COALESCE(oct_2024_unique_item_requests, 0) + 
            COALESCE(nov_2024_unique_item_requests, 0) + COALESCE(dec_2024_unique_item_requests, 0) + 
            COALESCE(jan_2025_unique_item_requests, 0) + COALESCE(feb_2025_unique_item_requests, 0) + 
            COALESCE(mar_2025_unique_item_requests, 0) + COALESCE(apr_2025_unique_item_requests, 0) + 
            COALESCE(may_2025_unique_item_requests, 0) + COALESCE(jun_2025_unique_item_requests, 0))`;
          
          selectClause += `
            ${totalUsageSQL} as total_requests,
            ${uniqueUsageSQL} as unique_requests,
            '2023-2025' as analysis_year
          `;
          orderClause += ` ${totalUsageSQL} DESC `;
          whereClause += ` AND ${totalUsageSQL} > 0 `;
        }
        
        // Add title filter if provided
        if (title) {
          whereClause += ` AND title ILIKE '%${title.replace(/'/g, "''")}%' `;
        }
        
        // Add publisher filter if provided
        if (publisher) {
          whereClause += ` AND publisher ILIKE '%${publisher.replace(/'/g, "''")}%' `;
        }
        
        // Build final query
        const finalQuery = selectClause + fromClause + whereClause + orderClause + ` LIMIT ${limit}`;
        
        // Log the SQL query being executed
        console.log("🔍 [SALES] analyzeJournalUsage - SQL Query:");
        console.log("📊 Parameters:", { title, publisher, limit, year });
        console.log("🗃️ Query:", finalQuery);
        console.log("─".repeat(80));
        
        // Execute raw query
        const results = await db.execute(sql.raw(finalQuery));
        
        console.log("✅ [SALES] analyzeJournalUsage - Query Results:");
        console.log("📈 Records returned:", results.length);
        console.log("🎯 Analysis year:", year || "2023-2025");
        if (results.length > 0) {
          console.log("📚 Top journal:", results[0]);
        }
        console.log("─".repeat(80));
        
        return { 
          journals: results,
          analysis_year: year || "2023-2025",
          total_analyzed: results.length
        };
      } catch (error) {
        console.error("Error analyzing journal usage:", error);
        return { 
          error: "I couldn't retrieve the journal usage data at the moment. Our journal analytics cover the period from January 2023 to August 2025. Please try a different search or time period.",
          data_period: "January 2023 - August 2025"
        };
      }
    },
  }),

  getRecentPurchases: tool({
    description: "Get recently purchased books to understand successful sales and buying patterns. Use this to identify what customers are actually purchasing.",
    inputSchema: z.object({
      limit: z.number().optional().default(10).describe("Number of recent purchases to return"),
      sortBy: z.string().optional().default("year").describe("Sort by 'year' (newest first) or 'title' (alphabetical)"),
    }),
    execute: async ({ limit = 10, sortBy = "year" }) => {
      console.log("🔧 [SALES TOOL] getRecentPurchases called");
      console.log("📥 Input parameters:", { limit, sortBy });
      console.log("⏰ Called at:", new Date().toISOString());
      console.log("─".repeat(50));
      try {
        let query: any = db.select().from(booksPurchased);
        
        if (sortBy === "year") {
          query = query.orderBy(desc(booksPurchased.year), desc(booksPurchased.createdAt));
        } else {
          query = query.orderBy(asc(booksPurchased.bookTitle));
        }
        
        const results = await query.limit(limit);
        
        // Log the query execution
        console.log("🔍 [SALES] getRecentPurchases - Drizzle Query:");
        console.log("📊 Parameters:", { limit, sortBy });
        console.log("🗃️ Query: SELECT * FROM books_purchased ORDER BY", sortBy === "year" ? "year DESC, created_at DESC" : "book_title ASC", `LIMIT ${limit}`);
        console.log("─".repeat(80));
        
        console.log("✅ [SALES] getRecentPurchases - Query Results:");
        console.log("📈 Records returned:", results.length);
        console.log("🎯 Sorted by:", sortBy);
        if (results.length > 0) {
          console.log("📖 First result:", results[0]);
        }
        console.log("─".repeat(80));
        
        return { 
          purchasedBooks: results,
          sortedBy: sortBy,
          total_analyzed: results.length
        };
      } catch (error) {
        console.error("Error getting recent purchases:", error);
        return { 
          error: "I couldn't access the recent purchase data at the moment. Our purchase records include books from various years. Please try again or contact support if needed.",
          data_available: "Purchase records from multiple years"
        };
      }
    },
  }),
};

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  
  // Log the incoming request
  console.log("🚀 [SALES API] New chat request received");
  console.log("📨 Messages count:", messages.length);
  console.log("💬 Latest message:", messages[messages.length - 1]?.parts?.[0]?.text || "N/A");
  console.log("🕐 Timestamp:", new Date().toISOString());
  console.log("═".repeat(80));
  
  const openrouter = createOpenRouter({
    apiKey: env.OPENROUTER_API_KEY,
  });

  const result = streamText({
    model: openrouter("x-ai/grok-4-fast:free"),
        system: `You are a Sales & Marketing AI assistant for an academic publisher.

Your goal is to help the sales team identify opportunities for upselling and lead generation based on usage data.

You have access to real database tools to analyze:
1. Book usage statistics (monthly data 2023-2025)
2. Journal usage statistics (monthly data 2023-2025)  
3. Book denial reports (when users tried to access content they don't have license for)
4. Journal denial reports
5. Recently purchased books

CRITICAL INSTRUCTIONS:
- ALWAYS use the provided tools to answer questions about sales data
- PARAMETER EXTRACTION is crucial - carefully extract year, limits, and filters from user queries:
  * "2025", "this year", "current year" → year="2025"
  * "2024", "last year", "previous year" → year="2024" 
  * "2023", "2 years ago" → year="2023"
  * "top 5", "best 5" → limit=5
  * "top 10", "best 10" → limit=10
  * Book/journal titles → title="extracted title"
- For book usage analysis, you can specify year="2023", year="2024", year="2025", or leave empty for all years combined
- Use year="2024" for current performance, year="2023" for historical comparison, or no year for overall trends
- AFTER calling a tool, you MUST provide a summary and analysis of the results
- Be data-driven and cite specific numbers from the database
- Highlight clear sales opportunities when you find them
- Format responses with clear sections and bullet points
- Never end your response immediately after a tool call - always analyze the results
- Provide actionable insights based on the tool results

ERROR HANDLING:
- If a tool returns an error, acknowledge the limitation gracefully without technical details
- Our data covers: January 2023 to August 2025 for usage data, various years for purchase data
- NEVER mention tool names, function names, or any technical implementation details
- Focus on what data is available and suggest alternative approaches
- Speak in business terms only: "sales data", "usage analytics", "purchase records", etc.

RESPONSE FORMATTING:
- Use clear headings with ## for main sections
- For numbered lists, use proper markdown: **1. Title** - Description
- Never mention internal tool names like "analyzeBookUsage", "trackBookDenials", etc.
- End responses with a "Related Questions" section suggesting 3-4 follow-up queries

PARAMETER EXTRACTION EXAMPLES - FOLLOW EXACTLY:
- "What are our top 5 most popular books in 2024?" → analyzeBookUsage({ limit: 5, year: "2024" })
- "Show me the best 3 books this year" → analyzeBookUsage({ limit: 3, year: "2025" })  
- "Most popular books in 2024" → analyzeBookUsage({ year: "2024" })
- "Top 10 books" → analyzeBookUsage({ limit: 10 })
- "Books with highest denial rates in 2024" → trackBookDenials({ year: "2024" })
- "Denial patterns this year" → trackBookDenials({ year: "2025" })
- "Which journals performed best this year?" → analyzeJournalUsage({ year: "2025" })
- "Journal usage in 2024" → analyzeJournalUsage({ year: "2024" })

CRITICAL: Always extract numbers and years from user queries and pass them as parameters!

EXAMPLE WORKFLOWS:
1. Extract parameters from user query FIRST
2. Call appropriate tool with extracted parameters
3. You MUST then respond with: "Based on our sales analytics, here are the key findings: [analyze the results]"
4. If tool fails: "I'm having trouble accessing that specific data right now. Our analytics cover January 2023 to August 2025. Would you like me to try a different time period or approach?"
5. Always end with: "## Related Questions\n- [Suggest relevant follow-up questions]"

YEAR OPTIONS: 2023 (historical), 2024 (current), 2025 (future/partial), or empty (all years combined)`,
    messages: convertToModelMessages(messages),
    tools: salesTools,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}