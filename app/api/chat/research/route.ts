import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText, convertToModelMessages, UIMessage, tool, stepCountIs } from "ai";
import { env } from "@/lib/env.mjs";
import { db } from "@/lib/db";
import { 
  books, journalSubscriptions, articles, chapters, 
  editors, articleData, bookData, chapterData 
} from "@/lib/db/schema";
import { eq, sql, desc, asc, and, or, like, gte, lte, between } from "drizzle-orm";
import z from "zod";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Research AI Tools for RAG
const researchTools = {
  searchBooks: tool({
    description: "Search for academic books by title, author, or university. Use this to help users find specific books or books by certain authors/institutions.",
    inputSchema: z.object({
      query: z.string().optional().describe("Search query for book title"),
      author: z.string().optional().describe("Author name to search for"),
      university: z.string().optional().describe("University affiliation"),
      limit: z.number().optional().default(10).describe("Number of results to return"),
    }),
    execute: async ({ query, author, university, limit = 10 }) => {
      console.log("🔧 [RESEARCH TOOL] searchBooks called");
      console.log("📥 Input parameters:", { query, author, university, limit });
      console.log("⏰ Called at:", new Date().toISOString());
      console.log("─".repeat(50));
      try {
        // Build WHERE conditions array with case-insensitive search
        const conditions = [];
        if (query) {
          // Search in both title and content for better results
          conditions.push(sql`(LOWER(${books.bookTitle}) LIKE LOWER(${`%${query}%`}) OR LOWER(${books.content}) LIKE LOWER(${`%${query}%`}))`);
        }
        if (author) {
          conditions.push(sql`LOWER(${books.authorName}) LIKE LOWER(${`%${author}%`})`);
        }
        if (university) {
          conditions.push(sql`LOWER(${books.university}) LIKE LOWER(${`%${university}%`})`);
        }
        
        // Execute query with proper WHERE clause
        let dbQuery: any = db.select().from(books);
        if (conditions.length > 0) {
          dbQuery = dbQuery.where(and(...conditions));
        }
        
        const results = await dbQuery.orderBy(desc(books.year), asc(books.bookTitle)).limit(limit);
        
        // Log the query execution
        console.log("🔍 [RESEARCH] searchBooks - Drizzle Query:");
        console.log("📊 Parameters:", { query, author, university, limit });
        console.log("🗃️ Query: SELECT * FROM books WHERE", 
          [query && `(LOWER(book_title) LIKE LOWER('%${query}%') OR LOWER(content) LIKE LOWER('%${query}%'))`, 
           author && `LOWER(author_name) LIKE LOWER('%${author}%')`, 
           university && `LOWER(university) LIKE LOWER('%${university}%')`].filter(Boolean).join(' AND ') || "1=1",
          "ORDER BY year DESC, book_title ASC LIMIT", limit);
        console.log("─".repeat(80));
        
        console.log("✅ [RESEARCH] searchBooks - Query Results:");
        console.log("📈 Records returned:", results.length);
        if (results.length > 0) {
          console.log("📚 First result:", results[0]);
        } else {
          console.log("ℹ️  No results found - checking if books table has any data...");
          const totalBooks = await db.select().from(books).limit(1);
          if (totalBooks.length === 0) {
            console.log("⚠️  Books table appears to be empty - data may need to be imported");
          } else {
            console.log("📖 Books table has data, but no matches for search terms");
          }
        }
        console.log("─".repeat(80));
        
        return { books: results };
      } catch (error) {
        console.error("Error searching books:", error);
        return { 
          error: "I couldn't access the book catalog right now. Our collection includes books from various years and universities. Please try a different search term or contact support if needed.",
          data_available: "Books from multiple years and institutions"
        };
      }
    },
  }),

  findJournals: tool({
    description: "Find journal subscriptions by title or abbreviation. Use this to help users discover available journals and their subscription status.",
    inputSchema: z.object({
      query: z.string().describe("Journal title or abbreviation to search for"),
      limit: z.number().optional().default(10).describe("Number of results to return"),
    }),
    execute: async ({ query, limit = 10 }) => {
      console.log("🔧 [RESEARCH TOOL] findJournals called");
      console.log("📥 Input parameters:", { query, limit });
      console.log("⏰ Called at:", new Date().toISOString());
      console.log("─".repeat(50));
      try {
        const results = await db.select()
          .from(journalSubscriptions)
          .where(or(
            like(journalSubscriptions.journalTitle, `%${query}%`),
            like(journalSubscriptions.journalAbbreviation, `%${query}%`)
          ))
          .orderBy(asc(journalSubscriptions.journalTitle))
          .limit(limit);
          
        // Log the query execution
        console.log("🔍 [RESEARCH] findJournals - Drizzle Query:");
        console.log("📊 Parameters:", { query, limit });
        console.log("🗃️ Query: SELECT * FROM journal_subscriptions WHERE (journal_title ILIKE '%", query, "%' OR journal_abbreviation ILIKE '%", query, "%') ORDER BY journal_title ASC LIMIT", limit);
        console.log("─".repeat(80));
        
        console.log("✅ [RESEARCH] findJournals - Query Results:");
        console.log("📈 Records returned:", results.length);
        if (results.length > 0) {
          console.log("📄 First result:", results[0]);
        }
        console.log("─".repeat(80));
        
        return { journals: results };
      } catch (error) {
        console.error("Error finding journals:", error);
        return { 
          error: "I couldn't access the journal database at the moment. Our collection includes various academic journals with subscription information. Please try a different search or contact support.",
          data_available: "Academic journals with subscription status"
        };
      }
    },
  }),

  searchArticles: tool({
    description: "Search for articles by title, author, or journal. Use this to help users find specific research articles.",
    inputSchema: z.object({
      query: z.string().optional().describe("Search query for article title"),
      author: z.string().optional().describe("Author name"),
      journalTitle: z.string().optional().describe("Journal title"),
      limit: z.number().optional().default(10).describe("Number of results to return"),
    }),
    execute: async ({ query, author, journalTitle, limit = 10 }) => {
      console.log("🔧 [RESEARCH TOOL] searchArticles called");
      console.log("📥 Input parameters:", { query, author, journalTitle, limit });
      console.log("⏰ Called at:", new Date().toISOString());
      console.log("─".repeat(50));
      try {
        // Build WHERE conditions array
        const conditions = [];
        if (query) {
          conditions.push(like(articles.title, `%${query}%`));
        }
        if (author) {
          conditions.push(like(articles.author, `%${author}%`));
        }
        if (journalTitle) {
          conditions.push(like(articles.journalTitle, `%${journalTitle}%`));
        }
        
        // Execute query with proper WHERE clause
        let dbQuery: any = db.select().from(articles);
        if (conditions.length > 0) {
          dbQuery = dbQuery.where(and(...conditions));
        }
        
        const results = await dbQuery.orderBy(asc(articles.title)).limit(limit);
        
        // Log the query execution
        console.log("🔍 [RESEARCH] searchArticles - Drizzle Query:");
        console.log("📊 Parameters:", { query, author, journalTitle, limit });
        console.log("🗃️ Query: SELECT * FROM articles WHERE",
          [query && `title ILIKE '%${query}%'`,
           author && `author ILIKE '%${author}%'`,
           journalTitle && `journal_title ILIKE '%${journalTitle}%'`].filter(Boolean).join(' AND ') || "1=1",
          "ORDER BY title ASC LIMIT", limit);
        console.log("─".repeat(80));
        
        console.log("✅ [RESEARCH] searchArticles - Query Results:");
        console.log("📈 Records returned:", results.length);
        if (results.length > 0) {
          console.log("📄 First result:", results[0]);
        }
        console.log("─".repeat(80));
        
        return { articles: results };
      } catch (error) {
        console.error("Error searching articles:", error);
        return { 
          error: "I couldn't access the article database right now. Our collection includes research articles from various journals and authors. Please try a different search term or approach.",
          data_available: "Research articles from multiple journals"
        };
      }
    },
  }),

  findChapters: tool({
    description: "Find book chapters by title, author, or book title. Use this to help users discover specific chapters within books.",
    inputSchema: z.object({
      query: z.string().optional().describe("Search query for chapter title"),
      author: z.string().optional().describe("Chapter author name"),
      bookTitle: z.string().optional().describe("Book title"),
      limit: z.number().optional().default(10).describe("Number of results to return"),
    }),
    execute: async ({ query, author, bookTitle, limit = 10 }) => {
      console.log("🔧 [RESEARCH TOOL] findChapters called");
      console.log("📥 Input parameters:", { query, author, bookTitle, limit });
      console.log("⏰ Called at:", new Date().toISOString());
      console.log("─".repeat(50));
      try {
        // Build WHERE conditions array
        const conditions = [];
        if (query) {
          conditions.push(like(chapters.chapterTitle, `%${query}%`));
        }
        if (author) {
          conditions.push(like(chapters.authorName, `%${author}%`));
        }
        if (bookTitle) {
          conditions.push(like(chapters.bookTitle, `%${bookTitle}%`));
        }
        
        // Execute query with proper WHERE clause
        let dbQuery: any = db.select().from(chapters);
        if (conditions.length > 0) {
          dbQuery = dbQuery.where(and(...conditions));
        }
        
        const results = await dbQuery.orderBy(asc(chapters.chapterTitle)).limit(limit);
        
        // Log the query execution
        console.log("🔍 [RESEARCH] findChapters - Drizzle Query:");
        console.log("📊 Parameters:", { query, author, bookTitle, limit });
        console.log("🗃️ Query: SELECT * FROM chapters WHERE",
          [query && `chapter_title ILIKE '%${query}%'`,
           author && `author_name ILIKE '%${author}%'`,
           bookTitle && `book_title ILIKE '%${bookTitle}%'`].filter(Boolean).join(' AND ') || "1=1",
          "ORDER BY chapter_title ASC LIMIT", limit);
        console.log("─".repeat(80));
        
        console.log("✅ [RESEARCH] findChapters - Query Results:");
        console.log("📈 Records returned:", results.length);
        if (results.length > 0) {
          console.log("📖 First result:", results[0]);
        }
        console.log("─".repeat(80));
        
        return { chapters: results };
      } catch (error) {
        console.error("Error finding chapters:", error);
        return { 
          error: "I couldn't access the chapter database at the moment. Our collection includes book chapters from various authors and publications. Please try a different search or contact support.",
          data_available: "Book chapters from multiple publications"
        };
      }
    },
  }),

  getEditorInfo: tool({
    description: "Get journal editor information to help users find editorial contacts or understand journal editorial structure.",
    inputSchema: z.object({
      journal: z.string().optional().describe("Journal title or abbreviation"),
      limit: z.number().optional().default(10).describe("Number of results to return"),
    }),
    execute: async ({ journal, limit = 10 }) => {
      console.log("🔧 [RESEARCH TOOL] getEditorInfo called");
      console.log("📥 Input parameters:", { journal, limit });
      console.log("⏰ Called at:", new Date().toISOString());
      console.log("─".repeat(50));
      try {
        // Execute query with proper WHERE clause
        let dbQuery: any = db.select().from(editors);
        
        if (journal) {
          dbQuery = dbQuery.where(
            or(
              like(editors.journalTitle, `%${journal}%`),
              like(editors.journalAbbr, `%${journal}%`)
            )
          );
        }
        
        const results = await dbQuery.orderBy(asc(editors.journalTitle)).limit(limit);
        
        // Log the query execution
        console.log("🔍 [RESEARCH] getEditorInfo - Drizzle Query:");
        console.log("📊 Parameters:", { journal, limit });
        console.log("🗃️ Query: SELECT * FROM editors WHERE",
          journal ? `(journal_title ILIKE '%${journal}%' OR journal_abbr ILIKE '%${journal}%')` : "1=1",
          "ORDER BY journal_title ASC LIMIT", limit);
        console.log("─".repeat(80));
        
        console.log("✅ [RESEARCH] getEditorInfo - Query Results:");
        console.log("📈 Records returned:", results.length);
        if (results.length > 0) {
          console.log("👤 First result:", results[0]);
        }
        console.log("─".repeat(80));
        
        return { editors: results };
      } catch (error) {
        console.error("Error getting editor info:", error);
        return { 
          error: "I couldn't access the editor information right now. Our database includes editorial details for various academic journals. Please try a different journal search or contact support.",
          data_available: "Editorial information for academic journals"
        };
      }
    },
  }),

  getArticleData: tool({
    description: "Get article publication statistics by year (2020-2025). ALWAYS extract year and limit from user queries. Examples: 'articles published in 2024' → {year: '2024'}, 'publication trends 2023' → {year: '2023'}",
    inputSchema: z.object({
      year: z.string().optional().describe("Filter by year. Extract from '2020', '2021', '2022', '2023', '2024', '2025', etc."),
      limit: z.number().optional().default(10).describe("Number of results to return. Extract from 'top 5', 'first 10', etc."),
    }),
    execute: async ({ year, limit = 10 }) => {
      console.log("🔧 [RESEARCH TOOL] getArticleData called");
      console.log("📥 Input parameters:", { year, limit });
      console.log("⏰ Called at:", new Date().toISOString());
      console.log("─".repeat(50));
      try {
        // Execute query - no WHERE clause needed since we'll filter by specific year columns
        const results = await db.select().from(articleData).orderBy(desc(articleData.allYearTotalCount)).limit(limit);
        
        // Log the query execution
        console.log("🔍 [RESEARCH] getArticleData - Drizzle Query:");
        console.log("📊 Parameters:", { year, limit });
        console.log("🗃️ Query: SELECT * FROM article_data ORDER BY all_year_total_count DESC LIMIT", limit);
        console.log("─".repeat(80));
        
        console.log("✅ [RESEARCH] getArticleData - Query Results:");
        console.log("📈 Records returned:", results.length);
        if (results.length > 0) {
          console.log("📊 First result:", results[0]);
        }
        console.log("─".repeat(80));
        
        return { articleData: results };
      } catch (error: any) {
        console.error("Error getting article data:", error);
        return { 
          error: "I couldn't access the article statistics right now. Our data includes publication counts from 2020 to 2025. Please try a different year or contact support.",
          data_available: "Article publication statistics (2020-2025)"
        };
      }
    },
  }),

  getBookData: tool({
    description: "Get book publication statistics and trends. ALWAYS extract limit from user queries. Examples: 'book publication stats' → {}, 'top 5 book publishers' → {limit: 5}",
    inputSchema: z.object({
      limit: z.number().optional().default(10).describe("Number of results to return. Extract from 'top 5', 'first 10', etc."),
    }),
    execute: async ({ limit = 10 }) => {
      console.log("🔧 [RESEARCH TOOL] getBookData called");
      console.log("📥 Input parameters:", { limit });
      console.log("⏰ Called at:", new Date().toISOString());
      console.log("─".repeat(50));
      try {
        const results = await db.select().from(bookData).orderBy(desc(bookData.booksPublished)).limit(limit);
        
        // Log the query execution
        console.log("🔍 [RESEARCH] getBookData - Drizzle Query:");
        console.log("📊 Parameters:", { limit });
        console.log("🗃️ Query: SELECT * FROM book_data ORDER BY books_published DESC LIMIT", limit);
        console.log("─".repeat(80));
        
        console.log("✅ [RESEARCH] getBookData - Query Results:");
        console.log("📈 Records returned:", results.length);
        if (results.length > 0) {
          console.log("📚 First result:", results[0]);
        }
        console.log("─".repeat(80));
        
        return { bookData: results };
      } catch (error: any) {
        console.error("Error getting book data:", error);
        return { 
          error: "I couldn't access the book publication statistics at the moment. Our collection includes comprehensive book publication data. Please try again or contact support.",
          data_available: "Book publication statistics and trends"
        };
      }
    },
  }),

  getChapterData: tool({
    description: "Get chapter statistics by university and publication trends. ALWAYS extract university and limit from user queries. Examples: 'chapters from MIT' → {university: 'MIT'}, 'top 3 universities by chapters' → {limit: 3}",
    inputSchema: z.object({
      university: z.string().optional().describe("Filter by university name. Extract from 'MIT', 'Harvard', 'Stanford', etc."),
      limit: z.number().optional().default(10).describe("Number of results to return. Extract from 'top 5', 'first 10', etc."),
    }),
    execute: async ({ university, limit = 10 }) => {
      console.log("🔧 [RESEARCH TOOL] getChapterData called");
      console.log("📥 Input parameters:", { university, limit });
      console.log("⏰ Called at:", new Date().toISOString());
      console.log("─".repeat(50));
      try {
        // Execute query with proper WHERE clause
        let dbQuery: any = db.select().from(chapterData);
        
        if (university) {
          dbQuery = dbQuery.where(like(chapterData.universityName, `%${university}%`));
        }
        
        const results = await dbQuery.orderBy(desc(chapterData.chapterCount)).limit(limit);
        
        // Log the query execution
        console.log("🔍 [RESEARCH] getChapterData - Drizzle Query:");
        console.log("📊 Parameters:", { university, limit });
        console.log("🗃️ Query: SELECT * FROM chapter_data WHERE",
          university ? `university_name ILIKE '%${university}%'` : "1=1",
          "ORDER BY chapter_count DESC LIMIT", limit);
        console.log("─".repeat(80));
        
        console.log("✅ [RESEARCH] getChapterData - Query Results:");
        console.log("📈 Records returned:", results.length);
        if (results.length > 0) {
          console.log("🏫 First result:", results[0]);
        }
        console.log("─".repeat(80));
        
        return { chapterData: results };
      } catch (error: any) {
        console.error("Error getting chapter data:", error);
        return { 
          error: "I couldn't access the chapter statistics right now. Our data includes chapter counts by university and publication trends. Please try a different search or contact support.",
          data_available: "Chapter statistics by university"
        };
      }
    },
  }),
};

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  
  // Log the incoming request
  console.log("🚀 [RESEARCH API] New chat request received");
  console.log("📨 Messages count:", messages.length);
  console.log("💬 Latest message:", messages[messages.length - 1]?.content || "N/A");
  console.log("🕐 Timestamp:", new Date().toISOString());
  console.log("═".repeat(80));
  
  const openrouter = createOpenRouter({
    apiKey: env.OPENROUTER_API_KEY,
  });

  const result = streamText({
    model: openrouter("x-ai/grok-4-fast:free"),
    system: `You are a Research Assistant AI for universities and researchers.

Your goal is to help users discover the perfect publications for their research needs.

You have access to real database tools to search:
1. Books - Complete catalog of academic books with authors and universities
2. Journal Subscriptions - Current journal subscriptions and availability
3. Articles - Individual articles from journals with subscription status
4. Chapters - Individual chapters from books with purchase status
5. Editors - Journal editor information for editorial contacts

CRITICAL INSTRUCTIONS:
- ALWAYS use the provided tools to answer questions about research publications
- PARAMETER EXTRACTION is crucial - carefully extract search terms, authors, and limits from user queries:
  * "artificial intelligence", "AI", "machine learning" → query="artificial intelligence"
  * "by John Smith", "author Smith" → author="Smith"
  * "from MIT", "at Harvard" → university="MIT"
  * "top 5", "first 5" → limit=5
  * "Nature journal", "Science journal" → query="Nature"
- AFTER calling a tool, you MUST provide a summary and analysis of the results
- Provide specific publication details when available
- Help users find relevant publications for their research topics
- When recommending publications, explain why they might be relevant
- Format responses with clear sections and bullet points
- Never end your response immediately after a tool call - always analyze the results
- Provide helpful recommendations based on the search results

ERROR HANDLING:
- If a tool returns an error, acknowledge the limitation gracefully without technical details
- Our database includes books, journals, articles, and chapters from various years and institutions
- NEVER mention tool names, function names, or any technical implementation details
- Focus on what data is available and suggest alternative search approaches
- Speak in academic terms only: "publication database", "research catalog", "journal collection", etc.

RESPONSE FORMATTING:
- Use clear headings with ## for main sections
- For numbered lists, use proper markdown: **1. Title** - Description
- Never mention internal tool names like "searchBooks", "findJournals", etc.
- End responses with a "Related Questions" section suggesting 3-4 follow-up queries

EXAMPLE WORKFLOWS:
1. User asks: "Find books about artificial intelligence" → searchBooks({ query: "artificial intelligence" })
2. User asks: "Find journals related to Nature" → findJournals({ query: "Nature" })
3. User asks: "Search for articles about machine learning" → searchArticles({ query: "machine learning" })
4. User asks: "Find chapters about data science" → findChapters({ query: "data science" })
5. User asks: "Show me editors for Science journals" → getEditorInfo({ journal: "Science" })
6. You MUST then respond with: "I found several relevant publications: [analyze and present the results]"
7. If tool fails: "I'm having trouble accessing the research catalog right now. Our collection includes publications from various universities and years. Would you like me to try searching with different keywords?"
8. Always end with: "## Related Questions\n- [Suggest relevant follow-up questions]"`,
    messages: convertToModelMessages(messages),
    tools: researchTools,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}