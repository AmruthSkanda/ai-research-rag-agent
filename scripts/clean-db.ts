import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function cleanDatabase() {
  try {
    console.log("🧹 Cleaning database - dropping all tables...");
    
    // Drop all tables in the correct order (respecting foreign key constraints)
    const tables = [
      // Sales tables
      "books_purchased",
      "journal_subscriptions_prev_year", 
      "journal_denials",
      "book_denials",
      "journal_usage",
      "book_usage",
      
      // Research tables
      "chapter_data",
      "book_data", 
      "article_data",
      "editors",
      "chapters",
      "articles",
      "journal_subscriptions",
      "books"
    ];
    
    for (const table of tables) {
      try {
        await db.execute(sql.raw(`DROP TABLE IF EXISTS "${table}" CASCADE;`));
        console.log(`  ✅ Dropped table: ${table}`);
      } catch (error) {
        console.log(`  ⚠️  Could not drop table ${table}:`, error);
      }
    }
    
    console.log("🎉 Database cleaned successfully!");
    console.log("✅ Ready for fresh schema creation and data import");
    
  } catch (error) {
    console.error("❌ Error cleaning database:", error);
    throw error;
  }
}

// Run the cleanup
cleanDatabase().catch(console.error);
