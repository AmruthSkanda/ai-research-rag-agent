import { db } from "@/lib/db";
import { env } from "@/lib/env.mjs";

async function testDatabaseConnection() {
  try {
    console.log("🔍 Testing database connection...");
    console.log("📋 Environment check:");
    console.log(`- NODE_ENV: ${env.NODE_ENV}`);
    console.log(`- DATABASE_URL: ${env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`);
    console.log(`- OPENROUTER_API_KEY: ${env.OPENROUTER_API_KEY ? '✅ Set' : '❌ Missing'}`);
    
    if (!env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set in environment variables");
    }

    console.log("\n🔌 Attempting to connect to database...");
    
    // Test basic connection with a simple query
    const result = await db.execute("SELECT 1 as test, NOW() as current_time, version() as postgres_version");
    
    console.log("✅ Database connection successful!");
    console.log("📊 Connection details:");
    console.log(`- Test query result: ${result[0]?.test}`);
    console.log(`- Current time: ${result[0]?.current_time}`);
    console.log(`- PostgreSQL version: ${result[0]?.postgres_version}`);
    
    // Test if pgvector extension is available
    console.log("\n🔍 Checking for pgvector extension...");
    try {
      const vectorTest = await db.execute("SELECT extname FROM pg_extension WHERE extname = 'vector'");
      if (vectorTest.length > 0) {
        console.log("✅ pgvector extension is installed and ready!");
      } else {
        console.log("⚠️  pgvector extension not found. You may need to install it:");
        console.log("   Run: CREATE EXTENSION IF NOT EXISTS vector;");
      }
    } catch (vectorError) {
      console.log("⚠️  Could not check pgvector extension:", vectorError);
    }
    
    // Test if we can create a simple table
    console.log("\n🧪 Testing table creation...");
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS connection_test (
          id SERIAL PRIMARY KEY,
          test_data TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log("✅ Table creation test successful!");
      
      // Clean up test table
      await db.execute("DROP TABLE IF EXISTS connection_test");
      console.log("✅ Test table cleaned up!");
      
    } catch (tableError) {
      console.log("❌ Table creation test failed:", tableError);
    }
    
    console.log("\n🎉 Database connection test completed successfully!");
    console.log("✅ Ready to proceed with schema creation and data import!");
    
  } catch (error) {
    console.error("❌ Database connection failed!");
    console.error("Error details:", error);
    
    console.log("\n🔧 Troubleshooting steps:");
    console.log("1. Check your .env file has correct DATABASE_URL");
    console.log("2. Verify your Supabase credentials are correct");
    console.log("3. Ensure your database is accessible from your IP");
    console.log("4. Check if pgvector extension is installed in your database");
    
    process.exit(1);
  }
}

// Run the test
testDatabaseConnection().catch(console.error);
