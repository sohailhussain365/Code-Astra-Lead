import { Router, type IRouter } from "express";
import { eq, and, gte, ilike, or, sql } from "drizzle-orm";
import { db, leadsTable, searchesTable } from "@workspace/db";
import {
  GetLeadsQueryParams,
  GetLeadParams,
  UpdateLeadParams,
  UpdateLeadBody,
  DeleteLeadParams,
  QualifyLeadParams,
  GenerateOutreachTemplateParams,
  GenerateOutreachTemplateBody,
  BulkUpdateLeadsBody,
  GetLeadsResponse,
  GetLeadResponse,
  UpdateLeadResponse,
  QualifyLeadResponse,
  GenerateOutreachTemplateResponse,
  BulkUpdateLeadsResponse,
  CreateLeadsBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/leads", async (req, res): Promise<void> => {
  const query = GetLeadsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const { stage, status, minScore, search, searchId } = query.data;

  const conditions = [];
  if (stage) conditions.push(eq(leadsTable.stage, stage));
  if (status) conditions.push(eq(leadsTable.outreachStatus, status));
  if (minScore != null) conditions.push(gte(leadsTable.leadScore, minScore));
  if (search) {
    conditions.push(
      or(
        ilike(leadsTable.businessName, `%${search}%`),
        ilike(leadsTable.address, `%${search}%`),
        ilike(leadsTable.category, `%${search}%`),
      ),
    );
  }
  if (searchId != null) conditions.push(eq(leadsTable.searchId, searchId));

  const leads = await db
    .select()
    .from(leadsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(leadsTable.createdAt);

  res.json(GetLeadsResponse.parse(leads));
});

router.post("/leads", async (req, res): Promise<void> => {
  const parsed = CreateLeadsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { leads: inputLeads, searchId } = parsed.data;

  const existingPlaceIds = await db
    .select({ placeId: leadsTable.placeId })
    .from(leadsTable);
  const existingSet = new Set(existingPlaceIds.map((r) => r.placeId));

  const newLeads = inputLeads.filter((l) => !existingSet.has(l.placeId));
  const skipped = inputLeads.length - newLeads.length;

  if (newLeads.length === 0) {
    res.status(201).json({ saved: 0, skipped, leads: [] });
    return;
  }

  const inserted = await db
    .insert(leadsTable)
    .values(
      newLeads.map((l) => ({
        ...l,
        searchId: searchId ?? null,
        stage: "new",
      })),
    )
    .returning();

  res.status(201).json({ saved: inserted.length, skipped, leads: inserted });
});

router.get("/leads/:id", async (req, res): Promise<void> => {
  const params = GetLeadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [lead] = await db
    .select()
    .from(leadsTable)
    .where(eq(leadsTable.id, params.data.id));

  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }

  res.json(GetLeadResponse.parse(lead));
});

router.patch("/leads/:id", async (req, res): Promise<void> => {
  const params = UpdateLeadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateLeadBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (body.data.stage !== undefined) updateData.stage = body.data.stage;
  if (body.data.outreachStatus !== undefined) updateData.outreachStatus = body.data.outreachStatus;
  if (body.data.callLaterAt !== undefined) updateData.callLaterAt = body.data.callLaterAt;
  if (body.data.notes !== undefined) updateData.notes = body.data.notes;
  if (body.data.aiQualification !== undefined) updateData.aiQualification = body.data.aiQualification;

  const [lead] = await db
    .update(leadsTable)
    .set(updateData)
    .where(eq(leadsTable.id, params.data.id))
    .returning();

  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }

  res.json(UpdateLeadResponse.parse(lead));
});

router.delete("/leads/:id", async (req, res): Promise<void> => {
  const params = DeleteLeadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [lead] = await db
    .delete(leadsTable)
    .where(eq(leadsTable.id, params.data.id))
    .returning();

  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/leads/:id/qualify", async (req, res): Promise<void> => {
  const params = QualifyLeadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [lead] = await db
    .select()
    .from(leadsTable)
    .where(eq(leadsTable.id, params.data.id));

  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }

  const signals: string[] = [];
  let score = lead.leadScore;

  if (!lead.hasWebsite) signals.push("No website — high opportunity for digital services");
  if (lead.hasWebsite) signals.push("Has a website — assess quality and modernness");
  if (!lead.hasPhone) signals.push("No phone listed — may be hard to reach cold");
  if (lead.rating != null && lead.rating < 4.0) signals.push(`Low rating (${lead.rating}★) — could use reputation management`);
  if (lead.rating != null && lead.rating >= 4.5) signals.push(`Excellent rating (${lead.rating}★) — strong existing brand`);
  if (lead.reviewCount != null && lead.reviewCount < 20) signals.push("Few reviews — growth opportunity for review campaigns");
  if (lead.reviewCount != null && lead.reviewCount > 100) signals.push("High review volume — established local presence");
  if (lead.opportunityTags) signals.push(...lead.opportunityTags.split(", ").filter(Boolean).map((t: string) => `Tagged: ${t}`));

  const hasHighPotential = !lead.hasWebsite || (lead.rating != null && lead.rating < 4.0) || (lead.reviewCount != null && lead.reviewCount < 20);
  const tier = score >= 70 ? "Hot" : score >= 40 ? "Warm" : "Cold";

  const qualification = `**${tier} Lead — ${lead.businessName}**\n\n` +
    `${lead.businessName} is a ${lead.category || "local business"} located in ${lead.city || lead.address || "the area"}. ` +
    (hasHighPotential
      ? `This business shows clear signs of needing digital help — ${signals.slice(0, 2).join(", ").toLowerCase()}. `
      : `This is an established business with solid fundamentals. `) +
    `With a lead score of ${score}/100, this is a ${tier.toLowerCase()} prospect. ` +
    `\n\n**Best angle:** ` +
    (!lead.hasWebsite
      ? "Lead with a website audit or free mockup — they have zero online presence to defend."
      : lead.rating != null && lead.rating < 4.0
      ? "Focus on reputation management and review generation — their rating is hurting their conversions."
      : "Focus on growth and scaling — they're doing well but could be doing more.") +
    `\n\n**Recommended next step:** ` +
    (score >= 70 ? "Call within 24 hours — high probability of conversion." : score >= 40 ? "Send a personalized email first, follow up with a call in 2-3 days." : "Add to a drip sequence and revisit in 2 weeks.");

  await db
    .update(leadsTable)
    .set({ aiQualification: qualification })
    .where(eq(leadsTable.id, params.data.id));

  res.json(QualifyLeadResponse.parse({
    leadId: lead.id,
    qualification,
    score,
    signals,
  }));
});

router.post("/leads/:id/outreach-template", async (req, res): Promise<void> => {
  const params = GenerateOutreachTemplateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = GenerateOutreachTemplateBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [lead] = await db
    .select()
    .from(leadsTable)
    .where(eq(leadsTable.id, params.data.id));

  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }

  const { type } = body.data;
  const name = lead.businessName;
  const city = lead.city || "your area";
  const noWebsite = !lead.hasWebsite;
  const lowRating = lead.rating != null && lead.rating < 4.0;

  let subject: string | null = null;
  let templateBody: string;

  if (type === "email") {
    subject = noWebsite
      ? `Quick question about ${name}'s online presence`
      : lowRating
      ? `Helping ${name} improve their online reputation`
      : `Growth opportunity for ${name}`;

    templateBody = noWebsite
      ? `Hi there,\n\nI was searching for businesses like ${name} in ${city} and noticed you don't currently have a website.\n\nIn today's market, most customers check online before visiting — without a website, you're likely losing leads every single day to competitors who show up in Google searches.\n\nI help local businesses like yours get online quickly and affordably. I'd love to show you what a simple, professional website could look like for ${name} — no commitment, completely free.\n\nWould you have 10 minutes this week for a quick call?\n\nBest,\n[Your Name]\n[Your Business]`
      : lowRating
      ? `Hi there,\n\nI came across ${name} while researching businesses in ${city}. I noticed your rating on Google is ${lead.rating}★ — and I wanted to reach out because I specialize in helping local businesses improve their online reputation.\n\nA few more positive reviews can make a significant difference in how many new customers choose you over a competitor. I have some specific strategies that work well for businesses like yours.\n\nWould you be open to a quick 15-minute call to discuss?\n\nBest,\n[Your Name]\n[Your Business]`
      : `Hi there,\n\nI was researching top businesses in ${city} and came across ${name} — you've clearly built something great in the community.\n\nI work with local businesses at your level to help them scale: more leads, more visibility, and smarter digital marketing that actually converts.\n\nI'd love to share a few specific ideas I have for ${name}. Would you have 15 minutes for a quick call this week?\n\nBest,\n[Your Name]\n[Your Business]`;
  } else {
    templateBody = noWebsite
      ? `Opening: "Hi, is this ${name}? Great — my name is [Your Name] and I help local businesses in ${city} get found online. I noticed ${name} doesn't have a website yet — is that something you've considered?"\n\nIf yes: "What's held you back so far? Cost? Time? — I get it. Most of my clients said the same thing. That's why I offer a free mockup so you can see exactly what it would look like before spending anything."\n\nIf no: "I completely understand. Can I ask — how do most of your new customers find you right now? [Listen]. That's great — imagine combining that with showing up on Google when someone searches for [category] in ${city}."\n\nClose: "I'd love to show you what this could look like for your business. Could we set up a 15-minute call this week?"` 
      : `Opening: "Hi, is this ${name}? Great — my name is [Your Name]. I was looking at local businesses in ${city} and came across ${name} — you've got a solid reputation there. I specialize in helping businesses like yours grow their customer base digitally."\n\nValue pitch: "I work with [category] businesses to generate more leads through SEO, Google Ads, and review management. On average my clients see a 30-40% increase in inbound inquiries within 90 days."\n\nQualifying question: "Are you currently doing any digital marketing, or is that something you're looking to explore?"\n\nClose: "I'd love to put together a free growth plan for ${name}. Could we set aside 15 minutes this week to go over it?"`;
  }

  res.json(GenerateOutreachTemplateResponse.parse({
    type,
    subject,
    body: templateBody,
  }));
});

router.post("/leads/bulk-action", async (req, res): Promise<void> => {
  const body = BulkUpdateLeadsBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const { ids, stage, outreachStatus } = body.data;

  if (!stage && !outreachStatus) {
    res.status(400).json({ error: "Provide at least stage or outreachStatus" });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (stage) updateData.stage = stage;
  if (outreachStatus !== undefined) updateData.outreachStatus = outreachStatus;

  let updated = 0;
  for (const id of ids) {
    const result = await db
      .update(leadsTable)
      .set(updateData)
      .where(eq(leadsTable.id, id))
      .returning();
    updated += result.length;
  }

  res.json(BulkUpdateLeadsResponse.parse({ updated }));
});

export default router;
