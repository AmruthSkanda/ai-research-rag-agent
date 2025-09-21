import { db } from "@/lib/db";
import { 
  books, journalSubscriptions, articles, chapters, editors, articleData, bookData, chapterData,
  bookUsage, journalUsage, bookDenials, journalDenials, booksPurchased, journalSubscriptionsPrevYear
} from "@/lib/db/schema";
import fs from "fs";
import path from "path";
import csv from "csv-parser";

// Helper function to parse CSV
async function parseCSV(filePath: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// Helper function to create RAG-compatible content
function createContent(row: any, fields: string[]): string {
  return fields
    .map(field => {
      const value = row[field];
      if (value && value.toString().trim()) {
        return `${field}: ${value}`;
      }
      return null;
    })
    .filter(Boolean)
    .join(' | ');
}

// Helper function to safely parse integers
function safeParseInt(value: any): number | null {
  if (!value || value.toString().trim() === '') return null;
  const parsed = parseInt(value.toString());
  return isNaN(parsed) ? null : parsed;
}

// Helper function to insert data in batches
async function insertInBatches(table: any, data: any[], batchSize: number = 100) {
  console.log(`📦 Inserting ${data.length} records in batches of ${batchSize}...`);
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    await db.insert(table).values(batch);
    console.log(`  ✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(data.length / batchSize)} (${batch.length} records)`);
  }
}

async function importData() {
  try {
    console.log("Starting CSV data import with ALL columns and RAG support...");
    
    const dataDir = path.join(process.cwd(), "data");
    
    // Import Research Agent Data
    console.log("Importing Research Agent data...");
    
    // Books - ALL columns preserved
    const bookDetails = await parseCSV(path.join(dataDir, "Book Details.csv"));
    await db.insert(books).values(
      bookDetails.map(row => ({
        bookcode: row.bookcode,
        bookTitle: row.book_title,
        authorName: row.author_name,
        university: row.university,
        year: safeParseInt(row.year) || 0,
        purchaseStatus: row.purchase_status,
        content: createContent(row, ['bookcode', 'book_title', 'author_name', 'university', 'year', 'purchase_status'])
      }))
    );
    console.log(`✅ Imported ${bookDetails.length} books with RAG content`);
    
    // Journal Subscriptions - ALL columns preserved
    const journalSubs = await parseCSV(path.join(dataDir, "Journal Subscription.csv"));
    await db.insert(journalSubscriptions).values(
      journalSubs.map(row => ({
        journalTitle: row.journal_title,
        journalAbbreviation: row.journal_abbreviation,
        currentYear: safeParseInt(row.current_year) || 0,
        previousYear: safeParseInt(row.previous_year) || 0,
        content: createContent(row, ['journal_title', 'journal_abbreviation', 'current_year', 'previous_year'])
      }))
    );
    console.log(`✅ Imported ${journalSubs.length} journal subscriptions with RAG content`);
    
    // Articles - ALL columns preserved (including typo in CSV)
    const articleDetails = await parseCSV(path.join(dataDir, "Article Details.csv"));
    await db.insert(articles).values(
      articleDetails.map(row => ({
        journalTitle: row.juoornal_title, // Note: typo in original CSV
        abbr: row.abbr,
        emails: row.emails,
        author: row.author,
        title: row.title,
        subscriptionStatus: row.subscription_status,
        content: createContent(row, ['juoornal_title', 'abbr', 'emails', 'author', 'title', 'subscription_status'])
      }))
    );
    console.log(`✅ Imported ${articleDetails.length} articles with RAG content`);
    
    // Chapters - ALL columns preserved
    const chapterDetails = await parseCSV(path.join(dataDir, "Chapter Details.csv"));
    await db.insert(chapters).values(
      chapterDetails.map(row => ({
        bookcode: row.bookcode,
        bookTitle: row.book_title,
        chapterTitle: row.chapter_title,
        authorName: row.author_name,
        university: row.university,
        purchaseStatus: row.purchase_status,
        content: createContent(row, ['bookcode', 'book_title', 'chapter_title', 'author_name', 'university', 'purchase_status'])
      }))
    );
    console.log(`✅ Imported ${chapterDetails.length} chapters with RAG content`);
    
    // Editors - ALL columns preserved
    const editorData = await parseCSV(path.join(dataDir, "Editor Data.csv"));
    await db.insert(editors).values(
      editorData.map(row => ({
        journalTitle: row.journal_title,
        journalAbbr: row.journal_abbr,
        editorCount: safeParseInt(row.editor_count) || 0,
        subscriptionStatus: row.subscription_status,
        sortOrder: safeParseInt(row.sort_order) || 0,
        content: createContent(row, ['journal_title', 'journal_abbr', 'editor_count', 'subscription_status', 'sort_order'])
      }))
    );
    console.log(`✅ Imported ${editorData.length} editors with RAG content`);
    
    // Article Data - ALL columns preserved
    const articleDataRows = await parseCSV(path.join(dataDir, "Article Data.csv"));
    await db.insert(articleData).values(
      articleDataRows.map(row => ({
        journalName: row.journal_name,
        abbr: row.abbr,
        year2020Count: safeParseInt(row.Year_2020_Count) || 0,
        year2021Count: safeParseInt(row.Year_2021_Count) || 0,
        year2022Count: safeParseInt(row.Year_2022_Count) || 0,
        year2023Count: safeParseInt(row.Year_2023_Count) || 0,
        year2024Count: safeParseInt(row.Year_2024_Count) || 0,
        year2025Count: safeParseInt(row.Year_2025_Count) || 0,
        allYearTotalCount: safeParseInt(row.All_Year_Total_Count) || 0,
        content: createContent(row, ['journal_name', 'abbr', 'Year_2020_Count', 'Year_2021_Count', 'Year_2022_Count', 'Year_2023_Count', 'Year_2024_Count', 'Year_2025_Count', 'All_Year_Total_Count'])
      }))
    );
    console.log(`✅ Imported ${articleDataRows.length} article data records with RAG content`);
    
    // Book Data - ALL columns preserved
    const bookDataRows = await parseCSV(path.join(dataDir, "Book Data.csv"));
    await db.insert(bookData).values(
      bookDataRows.map(row => ({
        publicationYear: safeParseInt(row.publication_year) || 0,
        booksPublished: safeParseInt(row.books_published) || 0,
        content: createContent(row, ['publication_year', 'books_published'])
      }))
    );
    console.log(`✅ Imported ${bookDataRows.length} book data records with RAG content`);
    
    // Chapter Data - ALL columns preserved
    const chapterDataRows = await parseCSV(path.join(dataDir, "Chapter Data.csv"));
    await db.insert(chapterData).values(
      chapterDataRows.map(row => ({
        universityName: row.university_name,
        bookxmlYear: safeParseInt(row.bookxml_year) || 0,
        chapterCount: safeParseInt(row.chapter_count) || 0,
        content: createContent(row, ['university_name', 'bookxml_year', 'chapter_count'])
      }))
    );
    console.log(`✅ Imported ${chapterDataRows.length} chapter data records with RAG content`);
    
    // Import Sales Agent Data
    console.log("Importing Sales Agent data...");
    
    // Book Usage - ALL monthly columns preserved (BATCH PROCESSING)
    const bookUsageData = await parseCSV(path.join(dataDir, "Book Usage.csv"));
    const bookUsageRecords = bookUsageData.map(row => ({
        title: row.Title,
        platform: row.Platform,
        publisher: row.Publisher,
        isbn: row.ISBN,
        yop: safeParseInt(row.YOP),
        // 2023 data
        jan2023Unique: safeParseInt(row.Jan_2023_Unique_Title_Requests),
        jan2023Total: safeParseInt(row.Jan_2023_Total_Item_Requests),
        feb2023Unique: safeParseInt(row.Feb_2023_Unique_Title_Requests),
        feb2023Total: safeParseInt(row.Feb_2023_Total_Item_Requests),
        mar2023Unique: safeParseInt(row.Mar_2023_Unique_Title_Requests),
        mar2023Total: safeParseInt(row.Mar_2023_Total_Item_Requests),
        apr2023Unique: safeParseInt(row.Apr_2023_Unique_Title_Requests),
        apr2023Total: safeParseInt(row.Apr_2023_Total_Item_Requests),
        may2023Unique: safeParseInt(row.May_2023_Unique_Title_Requests),
        may2023Total: safeParseInt(row.May_2023_Total_Item_Requests),
        jun2023Unique: safeParseInt(row.Jun_2023_Unique_Title_Requests),
        jun2023Total: safeParseInt(row.Jun_2023_Total_Item_Requests),
        jul2023Unique: safeParseInt(row.Jul_2023_Unique_Title_Requests),
        jul2023Total: safeParseInt(row.Jul_2023_Total_Item_Requests),
        aug2023Unique: safeParseInt(row.Aug_2023_Unique_Title_Requests),
        aug2023Total: safeParseInt(row.Aug_2023_Total_Item_Requests),
        sep2023Unique: safeParseInt(row.Sep_2023_Unique_Title_Requests),
        sep2023Total: safeParseInt(row.Sep_2023_Total_Item_Requests),
        oct2023Unique: safeParseInt(row.Oct_2023_Unique_Title_Requests),
        oct2023Total: safeParseInt(row.Oct_2023_Total_Item_Requests),
        nov2023Unique: safeParseInt(row.Nov_2023_Unique_Title_Requests),
        nov2023Total: safeParseInt(row.Nov_2023_Total_Item_Requests),
        dec2023Unique: safeParseInt(row.Dec_2023_Unique_Title_Requests),
        dec2023Total: safeParseInt(row.Dec_2023_Total_Item_Requests),
        // 2024 data
        jan2024Unique: safeParseInt(row.Jan_2024_Unique_Title_Requests),
        jan2024Total: safeParseInt(row.Jan_2024_Total_Item_Requests),
        feb2024Unique: safeParseInt(row.Feb_2024_Unique_Title_Requests),
        feb2024Total: safeParseInt(row.Feb_2024_Total_Item_Requests),
        mar2024Unique: safeParseInt(row.Mar_2024_Unique_Title_Requests),
        mar2024Total: safeParseInt(row.Mar_2024_Total_Item_Requests),
        apr2024Unique: safeParseInt(row.Apr_2024_Unique_Title_Requests),
        apr2024Total: safeParseInt(row.Apr_2024_Total_Item_Requests),
        may2024Unique: safeParseInt(row.May_2024_Unique_Title_Requests),
        may2024Total: safeParseInt(row.May_2024_Total_Item_Requests),
        jun2024Unique: safeParseInt(row.Jun_2024_Unique_Title_Requests),
        jun2024Total: safeParseInt(row.Jun_2024_Total_Item_Requests),
        jul2024Unique: safeParseInt(row.Jul_2024_Unique_Title_Requests),
        jul2024Total: safeParseInt(row.Jul_2024_Total_Item_Requests),
        aug2024Unique: safeParseInt(row.Aug_2024_Unique_Title_Requests),
        aug2024Total: safeParseInt(row.Aug_2024_Total_Item_Requests),
        sep2024Unique: safeParseInt(row.Sep_2024_Unique_Title_Requests),
        sep2024Total: safeParseInt(row.Sep_2024_Total_Item_Requests),
        oct2024Unique: safeParseInt(row.Oct_2024_Unique_Title_Requests),
        oct2024Total: safeParseInt(row.Oct_2024_Total_Item_Requests),
        nov2024Unique: safeParseInt(row.Nov_2024_Unique_Title_Requests),
        nov2024Total: safeParseInt(row.Nov_2024_Total_Item_Requests),
        dec2024Unique: safeParseInt(row.Dec_2024_Unique_Title_Requests),
        dec2024Total: safeParseInt(row.Dec_2024_Total_Item_Requests),
        // 2025 data
        jan2025Unique: safeParseInt(row.Jan_2025_Unique_Title_Requests),
        jan2025Total: safeParseInt(row.Jan_2025_Total_Item_Requests),
        feb2025Unique: safeParseInt(row.Feb_2025_Unique_Title_Requests),
        feb2025Total: safeParseInt(row.Feb_2025_Total_Item_Requests),
        mar2025Unique: safeParseInt(row.Mar_2025_Unique_Title_Requests),
        mar2025Total: safeParseInt(row.Mar_2025_Total_Item_Requests),
        apr2025Unique: safeParseInt(row.Apr_2025_Unique_Title_Requests),
        apr2025Total: safeParseInt(row.Apr_2025_Total_Item_Requests),
        may2025Unique: safeParseInt(row.May_2025_Unique_Title_Requests),
        may2025Total: safeParseInt(row.May_2025_Total_Item_Requests),
        jun2025Unique: safeParseInt(row.Jun_2025_Unique_Title_Requests),
        jun2025Total: safeParseInt(row.Jun_2025_Total_Item_Requests),
        jul2025Unique: safeParseInt(row.Jul_2025_Unique_Title_Requests),
        jul2025Total: safeParseInt(row.Jul_2025_Total_Item_Requests),
        aug2025Unique: safeParseInt(row.Aug_2025_Unique_Title_Requests),
        aug2025Total: safeParseInt(row.Aug_2025_Total_Item_Requests),
        content: createContent(row, Object.keys(row).filter(key => key !== 'Title' && key !== 'Platform' && key !== 'Publisher' && key !== 'ISBN' && key !== 'YOP'))
      }));
    
    await insertInBatches(bookUsage, bookUsageRecords, 50); // Smaller batches for large table
    console.log(`✅ Imported ${bookUsageData.length} book usage records with ALL monthly data`);
    
    const journalUsageData = await parseCSV(path.join(dataDir, "Journal Usage.csv"));
    const journalUsageRecords = journalUsageData.map(row => ({
        title: row.Title,
        publisher: row.Publisher,
        onlineIssn: row.Online_ISSN,
        printIssn: row.Print_ISSN,
        // 2023 data
        jan2023Total: safeParseInt(row.Jan_2023_Total_Item_Requests),
        jan2023Unique: safeParseInt(row.Jan_2023_Unique_Item_Requests),
        feb2023Total: safeParseInt(row.Feb_2023_Total_Item_Requests),
        feb2023Unique: safeParseInt(row.Feb_2023_Unique_Item_Requests),
        mar2023Total: safeParseInt(row.Mar_2023_Total_Item_Requests),
        mar2023Unique: safeParseInt(row.Mar_2023_Unique_Item_Requests),
        apr2023Total: safeParseInt(row.Apr_2023_Total_Item_Requests),
        apr2023Unique: safeParseInt(row.Apr_2023_Unique_Item_Requests),
        may2023Total: safeParseInt(row.May_2023_Total_Item_Requests),
        may2023Unique: safeParseInt(row.May_2023_Unique_Item_Requests),
        jun2023Total: safeParseInt(row.Jun_2023_Total_Item_Requests),
        jun2023Unique: safeParseInt(row.Jun_2023_Unique_Item_Requests),
        jul2023Total: safeParseInt(row.Jul_2023_Total_Item_Requests),
        jul2023Unique: safeParseInt(row.Jul_2023_Unique_Item_Requests),
        aug2023Total: safeParseInt(row.Aug_2023_Total_Item_Requests),
        aug2023Unique: safeParseInt(row.Aug_2023_Unique_Item_Requests),
        sep2023Total: safeParseInt(row.Sep_2023_Total_Item_Requests),
        sep2023Unique: safeParseInt(row.Sep_2023_Unique_Item_Requests),
        oct2023Total: safeParseInt(row.Oct_2023_Total_Item_Requests),
        oct2023Unique: safeParseInt(row.Oct_2023_Unique_Item_Requests),
        nov2023Total: safeParseInt(row.Nov_2023_Total_Item_Requests),
        nov2023Unique: safeParseInt(row.Nov_2023_Unique_Item_Requests),
        dec2023Total: safeParseInt(row.Dec_2023_Total_Item_Requests),
        dec2023Unique: safeParseInt(row.Dec_2023_Unique_Item_Requests),
        // 2024 data
        jan2024Total: safeParseInt(row.Jan_2024_Total_Item_Requests),
        jan2024Unique: safeParseInt(row.Jan_2024_Unique_Item_Requests),
        feb2024Total: safeParseInt(row.Feb_2024_Total_Item_Requests),
        feb2024Unique: safeParseInt(row.Feb_2024_Unique_Item_Requests),
        mar2024Total: safeParseInt(row.Mar_2024_Total_Item_Requests),
        mar2024Unique: safeParseInt(row.Mar_2024_Unique_Item_Requests),
        apr2024Total: safeParseInt(row.Apr_2024_Total_Item_Requests),
        apr2024Unique: safeParseInt(row.Apr_2024_Unique_Item_Requests),
        may2024Total: safeParseInt(row.May_2024_Total_Item_Requests),
        may2024Unique: safeParseInt(row.May_2024_Unique_Item_Requests),
        jun2024Total: safeParseInt(row.Jun_2024_Total_Item_Requests),
        jun2024Unique: safeParseInt(row.Jun_2024_Unique_Item_Requests),
        jul2024Total: safeParseInt(row.Jul_2024_Total_Item_Requests),
        jul2024Unique: safeParseInt(row.Jul_2024_Unique_Item_Requests),
        aug2024Total: safeParseInt(row.Aug_2024_Total_Item_Requests),
        aug2024Unique: safeParseInt(row.Aug_2024_Unique_Item_Requests),
        sep2024Total: safeParseInt(row.Sep_2024_Total_Item_Requests),
        sep2024Unique: safeParseInt(row.Sep_2024_Unique_Item_Requests),
        oct2024Total: safeParseInt(row.Oct_2024_Total_Item_Requests),
        oct2024Unique: safeParseInt(row.Oct_2024_Unique_Item_Requests),
        nov2024Total: safeParseInt(row.Nov_2024_Total_Item_Requests),
        nov2024Unique: safeParseInt(row.Nov_2024_Unique_Item_Requests),
        dec2024Total: safeParseInt(row.Dec_2024_Total_Item_Requests),
        dec2024Unique: safeParseInt(row.Dec_2024_Unique_Item_Requests),
        // 2025 data
        jan2025Total: safeParseInt(row.Jan_2025_Total_Item_Requests),
        jan2025Unique: safeParseInt(row.Jan_2025_Unique_Item_Requests),
        feb2025Total: safeParseInt(row.Feb_2025_Total_Item_Requests),
        feb2025Unique: safeParseInt(row.Feb_2025_Unique_Item_Requests),
        mar2025Total: safeParseInt(row.Mar_2025_Total_Item_Requests),
        mar2025Unique: safeParseInt(row.Mar_2025_Unique_Item_Requests),
        apr2025Total: safeParseInt(row.Apr_2025_Total_Item_Requests),
        apr2025Unique: safeParseInt(row.Apr_2025_Unique_Item_Requests),
        may2025Total: safeParseInt(row.May_2025_Total_Item_Requests),
        may2025Unique: safeParseInt(row.May_2025_Unique_Item_Requests),
        jun2025Total: safeParseInt(row.Jun_2025_Total_Item_Requests),
        jun2025Unique: safeParseInt(row.Jun_2025_Unique_Item_Requests),
        jul2025Total: safeParseInt(row.Jul_2025_Total_Item_Requests),
        jul2025Unique: safeParseInt(row.Jul_2025_Unique_Item_Requests),
        aug2025Total: safeParseInt(row.Aug_2025_Total_Item_Requests),
        aug2025Unique: safeParseInt(row.Aug_2025_Unique_Item_Requests),
        content: createContent(row, Object.keys(row).filter(key => key !== 'Title' && key !== 'Publisher' && key !== 'Online_ISSN' && key !== 'Print_ISSN'))
      }));
    
    await insertInBatches(journalUsage, journalUsageRecords, 100);
    console.log(`✅ Imported ${journalUsageData.length} journal usage records with ALL monthly data`);
    
    // Book Denials - ALL monthly columns preserved (BATCH PROCESSING)
    const bookDenialData = await parseCSV(path.join(dataDir, "Book Denial.csv"));
    const bookDenialRecords = bookDenialData.map(row => ({
        title: row.Title,
        publisher: row.Publisher,
        isbn: row.ISBN,
        yop: safeParseInt(row.YOP),
        // 2023 data
        jan2023LimitExceeded: safeParseInt(row.Jan_2023_Limit_Exceeded),
        jan2023NoLicense: safeParseInt(row.Jan_2023_No_License),
        feb2023NoLicense: safeParseInt(row.Feb_2023_No_License),
        mar2023NoLicense: safeParseInt(row.Mar_2023_No_License),
        mar2023LimitExceeded: safeParseInt(row.Mar_2023_Limit_Exceeded),
        apr2023NoLicense: safeParseInt(row.Apr_2023_No_License),
        apr2023LimitExceeded: safeParseInt(row.Apr_2023_Limit_Exceeded),
        may2023NoLicense: safeParseInt(row.May_2023_No_License),
        may2023LimitExceeded: safeParseInt(row.May_2023_Limit_Exceeded),
        jun2023NoLicense: safeParseInt(row.Jun_2023_No_License),
        jul2023NoLicense: safeParseInt(row.Jul_2023_No_License),
        aug2023NoLicense: safeParseInt(row.Aug_2023_No_License),
        aug2023LimitExceeded: safeParseInt(row.Aug_2023_Limit_Exceeded),
        sep2023NoLicense: safeParseInt(row.Sep_2023_No_License),
        sep2023LimitExceeded: safeParseInt(row.Sep_2023_Limit_Exceeded),
        oct2023NoLicense: safeParseInt(row.Oct_2023_No_License),
        nov2023NoLicense: safeParseInt(row.Nov_2023_No_License),
        dec2023NoLicense: safeParseInt(row.Dec_2023_No_License),
        // 2024 data
        jan2024NoLicense: safeParseInt(row.Jan_2024_No_License),
        jan2024LimitExceeded: safeParseInt(row.Jan_2024_Limit_Exceeded),
        feb2024NoLicense: safeParseInt(row.Feb_2024_No_License),
        mar2024NoLicense: safeParseInt(row.Mar_2024_No_License),
        mar2024LimitExceeded: safeParseInt(row.Mar_2024_Limit_Exceeded),
        apr2024NoLicense: safeParseInt(row.Apr_2024_No_License),
        apr2024LimitExceeded: safeParseInt(row.Apr_2024_Limit_Exceeded),
        may2024NoLicense: safeParseInt(row.May_2024_No_License),
        may2024LimitExceeded: safeParseInt(row.May_2024_Limit_Exceeded),
        jun2024NoLicense: safeParseInt(row.Jun_2024_No_License),
        jul2024NoLicense: safeParseInt(row.Jul_2024_No_License),
        aug2024NoLicense: safeParseInt(row.Aug_2024_No_License),
        aug2024LimitExceeded: safeParseInt(row.Aug_2024_Limit_Exceeded),
        sep2024NoLicense: safeParseInt(row.Sep_2024_No_License),
        sep2024LimitExceeded: safeParseInt(row.Sep_2024_Limit_Exceeded),
        oct2024NoLicense: safeParseInt(row.Oct_2024_No_License),
        oct2024LimitExceeded: safeParseInt(row.Oct_2024_Limit_Exceeded),
        nov2024NoLicense: safeParseInt(row.Nov_2024_No_License),
        nov2024LimitExceeded: safeParseInt(row.Nov_2024_Limit_Exceeded),
        dec2024NoLicense: safeParseInt(row.Dec_2024_No_License),
        // 2025 data
        jan2025NoLicense: safeParseInt(row.Jan_2025_No_License),
        jan2025LimitExceeded: safeParseInt(row.Jan_2025_Limit_Exceeded),
        feb2025NoLicense: safeParseInt(row.Feb_2025_No_License),
        feb2025LimitExceeded: safeParseInt(row.Feb_2025_Limit_Exceeded),
        mar2025NoLicense: safeParseInt(row.Mar_2025_No_License),
        mar2025LimitExceeded: safeParseInt(row.Mar_2025_Limit_Exceeded),
        apr2025NoLicense: safeParseInt(row.Apr_2025_No_License),
        apr2025LimitExceeded: safeParseInt(row.Apr_2025_Limit_Exceeded),
        may2025NoLicense: safeParseInt(row.May_2025_No_License),
        may2025LimitExceeded: safeParseInt(row.May_2025_Limit_Exceeded),
        jun2025NoLicense: safeParseInt(row.Jun_2025_No_License),
        jul2025NoLicense: safeParseInt(row.Jul_2025_No_License),
        aug2025NoLicense: safeParseInt(row.Aug_2025_No_License),
        aug2025LimitExceeded: safeParseInt(row.Aug_2025_Limit_Exceeded),
        content: createContent(row, Object.keys(row).filter(key => key !== 'Title' && key !== 'Publisher' && key !== 'ISBN' && key !== 'YOP'))
      }));
    
    await insertInBatches(bookDenials, bookDenialRecords, 100);
    console.log(`✅ Imported ${bookDenialData.length} book denial records with ALL monthly data`);
    
    // Journal Denials - ALL monthly columns preserved
    const journalDenialData = await parseCSV(path.join(dataDir, "Journal Denial.csv"));
    const journalDenialRecords = journalDenialData.map(row => ({
        title: row.Title,
        publisher: row.Publisher,
        onlineIssn: row.Online_ISSN,
        printIssn: row.Print_ISSN,
        // Monthly denial data (2023-2025)
        feb2023NoLicense: safeParseInt(row.Feb_2023_No_License),
        mar2023NoLicense: safeParseInt(row.Mar_2023_No_License),
        apr2023NoLicense: safeParseInt(row.Apr_2023_No_License),
        may2023NoLicense: safeParseInt(row.May_2023_No_License),
        jun2023NoLicense: safeParseInt(row.Jun_2023_No_License),
        sep2023NoLicense: safeParseInt(row.Sep_2023_No_License),
        oct2023NoLicense: safeParseInt(row.Oct_2023_No_License),
        mar2024NoLicense: safeParseInt(row.Mar_2024_No_License),
        apr2024NoLicense: safeParseInt(row.Apr_2024_No_License),
        may2024NoLicense: safeParseInt(row.May_2024_No_License),
        aug2024NoLicense: safeParseInt(row.Aug_2024_No_License),
        sep2024NoLicense: safeParseInt(row.Sep_2024_No_License),
        oct2024NoLicense: safeParseInt(row.Oct_2024_No_License),
        nov2024NoLicense: safeParseInt(row.Nov_2024_No_License),
        dec2024NoLicense: safeParseInt(row.Dec_2024_No_License),
        jan2025NoLicense: safeParseInt(row.Jan_2025_No_License),
        feb2025NoLicense: safeParseInt(row.Feb_2025_No_License),
        mar2025NoLicense: safeParseInt(row.Mar_2025_No_License),
        apr2025NoLicense: safeParseInt(row.Apr_2025_No_License),
        jun2025NoLicense: safeParseInt(row.Jun_2025_No_License),
        jul2025NoLicense: safeParseInt(row.Jul_2025_No_License),
        aug2025NoLicense: safeParseInt(row.Aug_2025_No_License),
        content: createContent(row, Object.keys(row).filter(key => key !== 'Title' && key !== 'Publisher' && key !== 'Online_ISSN' && key !== 'Print_ISSN'))
      }));
    
    await insertInBatches(journalDenials, journalDenialRecords, 100);
    console.log(`✅ Imported ${journalDenialData.length} journal denial records with ALL monthly data`);
    
    // Books Purchased - Only has bookcode, book_title, year
    const booksPurchasedData = await parseCSV(path.join(dataDir, "Books Purchased.csv"));
    await db.insert(booksPurchased).values(
      booksPurchasedData.map(row => ({
        bookcode: row.bookcode,
        bookTitle: row.book_title,
        authorName: null, // Not available in this CSV
        university: null, // Not available in this CSV
        year: safeParseInt(row.year) || 0,
        content: createContent(row, ['bookcode', 'book_title', 'year'])
      }))
    );
    console.log(`✅ Imported ${booksPurchasedData.length} purchased books with RAG content`);
    
    // Journal Subscriptions Previous Year - ALL yearly columns preserved
    const journalSubsPrevYear = await parseCSV(path.join(dataDir, "Journal Subscriptions Prev Year.csv"));
    await db.insert(journalSubscriptionsPrevYear).values(
      journalSubsPrevYear.map(row => ({
        journalTitle: row.journal_title,
        journalAbbreviation: row.journal_abbreviation,
        // ALL yearly columns (2012-2024)
        year2012: safeParseInt(row['2012']),
        year2013: safeParseInt(row['2013']),
        year2014: safeParseInt(row['2014']),
        year2015: safeParseInt(row['2015']),
        year2016: safeParseInt(row['2016']),
        year2017: safeParseInt(row['2017']),
        year2018: safeParseInt(row['2018']),
        year2019: safeParseInt(row['2019']),
        year2020: safeParseInt(row['2020']),
        year2021: safeParseInt(row['2021']),
        year2022: safeParseInt(row['2022']),
        year2023: safeParseInt(row['2023']),
        year2024: safeParseInt(row['2024']),
        content: createContent(row, Object.keys(row).filter(key => key !== 'journal_title' && key !== 'journal_abbreviation' && key !== '--name'))
      }))
    );
    console.log(`✅ Imported ${journalSubsPrevYear.length} journal subscription history records with RAG content`);
    
    console.log("🎉 All data imported successfully with RAG support!");
    
  } catch (error) {
    console.error("❌ Error importing data:", error);
    throw error;
  }
}

// Run the import
importData().catch(console.error);
