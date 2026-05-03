import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, searchesTable, leadsTable } from "@workspace/db";
import {
  CreateSearchBody,
  DeleteSearchParams,
  GetSearchesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/searches", async (_req, res): Promise<void> => {
  const searches = await db
    .select()
    .from(searchesTable)
    .orderBy(searchesTable.createdAt);

  res.json(GetSearchesResponse.parse(searches));
});

router.post("/searches", async (req, res): Promise<void> => {
  const parsed = CreateSearchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [search] = await db
    .insert(searchesTable)
    .values(parsed.data)
    .returning();

  res.status(201).json(search);
});

router.delete("/searches/:id", async (req, res): Promise<void> => {
  const params = DeleteSearchParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db
    .delete(leadsTable)
    .where(eq(leadsTable.searchId, params.data.id));

  const [search] = await db
    .delete(searchesTable)
    .where(eq(searchesTable.id, params.data.id))
    .returning();

  if (!search) {
    res.status(404).json({ error: "Search not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
