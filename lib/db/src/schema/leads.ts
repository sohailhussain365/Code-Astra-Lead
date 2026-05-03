import {
  pgTable,
  text,
  serial,
  integer,
  real,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const searchesTable = pgTable("searches", {
  id: serial("id").primaryKey(),
  keyword: text("keyword").notNull(),
  location: text("location").notNull(),
  radius: integer("radius"),
  leadCount: integer("lead_count").notNull().default(0),
  avgScore: real("avg_score"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSearchSchema = createInsertSchema(searchesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertSearch = z.infer<typeof insertSearchSchema>;
export type Search = typeof searchesTable.$inferSelect;

export const leadsTable = pgTable("leads", {
  id: serial("id").primaryKey(),
  searchId: integer("search_id").references(() => searchesTable.id, { onDelete: "set null" }),
  placeId: text("place_id").notNull(),
  businessName: text("business_name").notNull(),
  address: text("address"),
  city: text("city"),
  phone: text("phone"),
  website: text("website"),
  rating: real("rating"),
  reviewCount: integer("review_count"),
  hasWebsite: boolean("has_website").notNull().default(false),
  hasPhone: boolean("has_phone").notNull().default(false),
  leadScore: integer("lead_score").notNull().default(0),
  opportunityTags: text("opportunity_tags"),
  category: text("category"),
  googleMapsUrl: text("google_maps_url"),
  linkedinSearch: text("linkedin_search"),
  stage: text("stage").notNull().default("new"),
  outreachStatus: text("outreach_status"),
  callLaterAt: timestamp("call_later_at", { withTimezone: true }),
  notes: text("notes"),
  aiQualification: text("ai_qualification"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertLeadSchema = createInsertSchema(leadsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leadsTable.$inferSelect;
