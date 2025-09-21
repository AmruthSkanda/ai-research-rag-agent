import { db } from "@/lib/db";
import { 
  books, journalSubscriptions, articles, chapters, editors, articleData, bookData, chapterData,
  bookUsage, journalUsage, bookDenials, journalDenials, booksPurchased, journalSubscriptionsPrevYear
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { openai } from "@ai-sdk/openai";
import { generateEmbedding } from "ai";
import { env } from "@/lib/env.mjs";

// Configure OpenAI client for embeddings
const openaiClient = openai({
  apiKey: env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

async function generateEmbeddings() {
  try {
    console.log("🚀 Starting vector embedding generation...");
    console.log("📊 This will process all content fields and generate embeddings for RAG");
    
    // Process all tables with content fields
    const tables = [
      { name: "books", table: books, batchSize: 50 },
      { name: "journal_subscriptions", table: journalSubscriptions, batchSize: 50 },
      { name: "articles", table: articles, batchSize: 50 },
      { name: "chapters", table: chapters, batchSize: 50 },
      { name: "editors", table: editors, batchSize: 50 },
      { name: "article_data", table: articleData, batchSize: 50 },
      { name: "book_data", table: bookData, batchSize: 50 },
      { name: "chapter_data", table: chapterData, batchSize: 50 },
      { name: "book_usage", table: bookUsage, batchSize: 25 }, // Smaller batches for large table
      { name: "journal_usage", table: journalUsage, batchSize: 50 },
      { name: "book_denials", table: bookDenials, batchSize: 50 },
      { name: "journal_denials", table: journalDenials, batchSize: 50 },
      { name: "books_purchased", table: booksPurchased, batchSize: 50 },
      { name: "journal_subscriptions_prev_year", table: journalSubscriptionsPrevYear, batchSize: 50 },
    ];

    for (const { name, table, batchSize } of tables) {
      console.log(`\n📝 Processing ${name}...`);
      
      // Get all records that need embeddings
      const records = await db.select().from(table).where(eq(table.embedding, null));
      
      if (records.length === 0) {
        console.log(`  ✅ ${name}: No records need embeddings`);
        continue;
      }
      
      console.log(`  📊 Found ${records.length} records to process`);
      
      // Process in batches
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        console.log(`  🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(records.length / batchSize)} (${batch.length} records)`);
        
        // Generate embeddings for this batch
        const embeddingPromises = batch.map(async (record) => {
          try {
            const { embedding } = await generateEmbedding({
              model: openaiClient.embedding("text-embedding-3-small"),
              value: record.content,
            });
            
            return {
              id: record.id,
              embedding: embedding,
            };
          } catch (error) {
            console.error(`    ❌ Error generating embedding for record ${record.id}:`, error);
            return null;
          }
        });
        
        const embeddings = await Promise.all(embeddingPromises);
        const validEmbeddings = embeddings.filter(Boolean);
        
        // Update records with embeddings
        for (const { id, embedding } of validEmbeddings) {
          await db.update(table)
            .set({ embedding })
            .where(eq(table.id, id));
        }
        
        console.log(`    ✅ Updated ${validEmbeddings.length} records with embeddings`);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`  🎉 ${name}: Completed embedding generation`);
    }
    
    console.log("\n🎉 All embeddings generated successfully!");
    console.log("✅ Database is now ready for RAG queries");
    
  } catch (error) {
    console.error("❌ Error generating embeddings:", error);
    throw error;
  }
}

// Run the embedding generation
generateEmbeddings().catch(console.error);
