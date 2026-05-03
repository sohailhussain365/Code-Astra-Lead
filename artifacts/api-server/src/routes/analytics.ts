import { Router, type IRouter } from "express";
import { lte, eq, count, avg, sql } from "drizzle-orm";
import { db, leadsTable, searchesTable } from "@workspace/db";
import {
  GetAnalyticsSummaryResponse,
  GetStageBreakdownResponse,
  GetFollowupsResponse,
  GetScoreDistributionResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/analytics/summary", async (_req, res): Promise<void> => {
  const [totals] = await db
    .select({
      totalLeads: count(),
      hotLeads: sql<number>`count(*) filter (where ${leadsTable.leadScore} >= 70)`,
      contacted: sql<number>`count(*) filter (where ${leadsTable.stage} != 'new')`,
      qualified: sql<number>`count(*) filter (where ${leadsTable.stage} = 'qualified')`,
      won: sql<number>`count(*) filter (where ${leadsTable.stage} = 'won')`,
      avgScore: avg(leadsTable.leadScore),
      followupsDue: sql<number>`count(*) filter (where ${leadsTable.outreachStatus} = 'call_later' and ${leadsTable.callLaterAt} <= now())`,
    })
    .from(leadsTable);

  const [{ totalSearches }] = await db
    .select({ totalSearches: count() })
    .from(searchesTable);

  res.json(
    GetAnalyticsSummaryResponse.parse({
      totalLeads: Number(totals.totalLeads),
      hotLeads: Number(totals.hotLeads),
      contacted: Number(totals.contacted),
      qualified: Number(totals.qualified),
      won: Number(totals.won),
      avgScore: totals.avgScore != null ? Number(totals.avgScore) : null,
      followupsDue: Number(totals.followupsDue),
      totalSearches: Number(totalSearches),
    }),
  );
});

router.get("/analytics/stage-breakdown", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      stage: leadsTable.stage,
      count: count(),
      avgScore: avg(leadsTable.leadScore),
    })
    .from(leadsTable)
    .groupBy(leadsTable.stage);

  res.json(
    GetStageBreakdownResponse.parse(
      rows.map((r) => ({
        stage: r.stage,
        count: Number(r.count),
        avgScore: r.avgScore != null ? Number(r.avgScore) : null,
      })),
    ),
  );
});

router.get("/analytics/followups", async (_req, res): Promise<void> => {
  const leads = await db
    .select()
    .from(leadsTable)
    .where(eq(leadsTable.outreachStatus, "call_later"))
    .orderBy(leadsTable.callLaterAt);

  res.json(GetFollowupsResponse.parse(leads));
});

router.get("/analytics/score-distribution", async (_req, res): Promise<void> => {
  const [hot, warm, cold] = await Promise.all([
    db
      .select({ count: count() })
      .from(leadsTable)
      .where(sql`${leadsTable.leadScore} >= 70`),
    db
      .select({ count: count() })
      .from(leadsTable)
      .where(
        sql`${leadsTable.leadScore} >= 40 and ${leadsTable.leadScore} < 70`,
      ),
    db
      .select({ count: count() })
      .from(leadsTable)
      .where(sql`${leadsTable.leadScore} < 40`),
  ]);

  res.json(
    GetScoreDistributionResponse.parse([
      { bucket: "Hot (70-100)", count: Number(hot[0].count) },
      { bucket: "Warm (40-69)", count: Number(warm[0].count) },
      { bucket: "Cold (0-39)", count: Number(cold[0].count) },
    ]),
  );
});

export default router;
