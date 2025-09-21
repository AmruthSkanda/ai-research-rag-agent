import { pgTable, text, varchar, integer, timestamp, vector, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { nanoid } from "nanoid";

// Research Agent Tables (8 tables) - RAG Compatible with pgvector

export const books = pgTable("books", {
  id: varchar("id", { length: 191 }).primaryKey().$defaultFn(() => nanoid()),
  bookcode: varchar("bookcode", { length: 50 }).notNull(),
  bookTitle: text("book_title").notNull(),
  authorName: text("author_name").notNull(),
  university: text("university").notNull(),
  year: integer("year").notNull(),
  purchaseStatus: text("purchase_status").notNull(),
  // RAG fields
  content: text("content").notNull(), // Combined searchable content
  embedding: vector("embedding", { dimensions: 1536 }), // pgvector for RAG
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
}, (table) => ({
  embeddingIndex: index("books_embedding_idx").using("hnsw", table.embedding.op("vector_cosine_ops")),
}));

export const journalSubscriptions = pgTable("journal_subscriptions", {
  id: varchar("id", { length: 191 }).primaryKey().$defaultFn(() => nanoid()),
  journalTitle: text("journal_title").notNull(),
  journalAbbreviation: varchar("journal_abbreviation", { length: 50 }).notNull(),
  currentYear: integer("current_year").notNull(),
  previousYear: integer("previous_year").notNull(),
  // RAG fields
  content: text("content").notNull(), // Combined searchable content
  embedding: vector("embedding", { dimensions: 1536 }), // pgvector for RAG
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
}, (table) => ({
  embeddingIndex: index("journal_subscriptions_embedding_idx").using("hnsw", table.embedding.op("vector_cosine_ops")),
}));

export const articles = pgTable("articles", {
  id: varchar("id", { length: 191 }).primaryKey().$defaultFn(() => nanoid()),
  journalTitle: text("journal_title").notNull(), // Note: original CSV has typo "juoornal_title"
  abbr: varchar("abbr", { length: 50 }).notNull(),
  emails: text("emails"),
  author: text("author").notNull(),
  title: text("title").notNull(),
  subscriptionStatus: text("subscription_status").notNull(),
  // RAG fields
  content: text("content").notNull(), // Combined searchable content
  embedding: vector("embedding", { dimensions: 1536 }), // pgvector for RAG
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
}, (table) => ({
  embeddingIndex: index("articles_embedding_idx").using("hnsw", table.embedding.op("vector_cosine_ops")),
}));

export const chapters = pgTable("chapters", {
  id: varchar("id", { length: 191 }).primaryKey().$defaultFn(() => nanoid()),
  bookcode: varchar("bookcode", { length: 50 }).notNull(),
  bookTitle: text("book_title").notNull(),
  chapterTitle: text("chapter_title").notNull(),
  authorName: text("author_name").notNull(),
  university: text("university").notNull(),
  purchaseStatus: text("purchase_status").notNull(),
  // RAG fields
  content: text("content").notNull(), // Combined searchable content
  embedding: vector("embedding", { dimensions: 1536 }), // pgvector for RAG
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
}, (table) => ({
  embeddingIndex: index("chapters_embedding_idx").using("hnsw", table.embedding.op("vector_cosine_ops")),
}));

export const editors = pgTable("editors", {
  id: varchar("id", { length: 191 }).primaryKey().$defaultFn(() => nanoid()),
  journalTitle: text("journal_title").notNull(),
  journalAbbr: varchar("journal_abbr", { length: 50 }).notNull(),
  editorCount: integer("editor_count").notNull(),
  subscriptionStatus: text("subscription_status").notNull(),
  sortOrder: integer("sort_order").notNull(),
  // RAG fields
  content: text("content").notNull(), // Combined searchable content
  embedding: vector("embedding", { dimensions: 1536 }), // pgvector for RAG
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
}, (table) => ({
  embeddingIndex: index("editors_embedding_idx").using("hnsw", table.embedding.op("vector_cosine_ops")),
}));

export const articleData = pgTable("article_data", {
  id: varchar("id", { length: 191 }).primaryKey().$defaultFn(() => nanoid()),
  journalName: text("journal_name").notNull(),
  abbr: varchar("abbr", { length: 50 }).notNull(),
  year2020Count: integer("year_2020_count").notNull(),
  year2021Count: integer("year_2021_count").notNull(),
  year2022Count: integer("year_2022_count").notNull(),
  year2023Count: integer("year_2023_count").notNull(),
  year2024Count: integer("year_2024_count").notNull(),
  year2025Count: integer("year_2025_count").notNull(),
  allYearTotalCount: integer("all_year_total_count").notNull(),
  // RAG fields
  content: text("content").notNull(), // Combined searchable content
  embedding: vector("embedding", { dimensions: 1536 }), // pgvector for RAG
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
}, (table) => ({
  embeddingIndex: index("article_data_embedding_idx").using("hnsw", table.embedding.op("vector_cosine_ops")),
}));

export const bookData = pgTable("book_data", {
  id: varchar("id", { length: 191 }).primaryKey().$defaultFn(() => nanoid()),
  publicationYear: integer("publication_year").notNull(),
  booksPublished: integer("books_published").notNull(),
  // RAG fields
  content: text("content").notNull(), // Combined searchable content
  embedding: vector("embedding", { dimensions: 1536 }), // pgvector for RAG
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
}, (table) => ({
  embeddingIndex: index("book_data_embedding_idx").using("hnsw", table.embedding.op("vector_cosine_ops")),
}));

export const chapterData = pgTable("chapter_data", {
  id: varchar("id", { length: 191 }).primaryKey().$defaultFn(() => nanoid()),
  universityName: text("university_name").notNull(),
  bookxmlYear: integer("bookxml_year").notNull(),
  chapterCount: integer("chapter_count").notNull(),
  // RAG fields
  content: text("content").notNull(), // Combined searchable content
  embedding: vector("embedding", { dimensions: 1536 }), // pgvector for RAG
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
}, (table) => ({
  embeddingIndex: index("chapter_data_embedding_idx").using("hnsw", table.embedding.op("vector_cosine_ops")),
}));
