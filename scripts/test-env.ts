import { config } from "dotenv";

// Load environment variables
config({ path: ".env.local" });
config({ path: ".env" });

console.log("🔍 Environment Variables Test");
console.log("==============================");

console.log("\n📋 Raw process.env values:");
console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
console.log(`- OPENROUTER_API_KEY: ${process.env.OPENROUTER_API_KEY ? '✅ Set (length: ' + process.env.OPENROUTER_API_KEY.length + ')' : '❌ Missing'}`);
console.log(`- DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set (length: ' + process.env.DATABASE_URL.length + ')' : '❌ Missing'}`);

console.log("\n📁 Checking for .env files:");
import fs from "fs";
import path from "path";

const envLocalPath = path.join(process.cwd(), ".env.local");
const envPath = path.join(process.cwd(), ".env");

console.log(`- .env.local exists: ${fs.existsSync(envLocalPath) ? '✅ Yes' : '❌ No'}`);
console.log(`- .env exists: ${fs.existsSync(envPath) ? '✅ Yes' : '❌ No'}`);

if (fs.existsSync(envLocalPath)) {
  console.log("\n📄 .env.local content preview:");
  const content = fs.readFileSync(envLocalPath, 'utf8');
  const lines = content.split('\n').slice(0, 3); // Show first 3 lines
  lines.forEach(line => {
    if (line.trim() && !line.includes('API_KEY')) {
      console.log(`  ${line}`);
    } else if (line.includes('API_KEY')) {
      console.log(`  ${line.split('=')[0]}=***hidden***`);
    }
  });
}

console.log("\n✅ Environment test completed!");
