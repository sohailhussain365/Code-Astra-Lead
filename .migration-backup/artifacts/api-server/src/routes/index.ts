import { Router, type IRouter } from "express";
import healthRouter from "./health";
import leadsRouter from "./leads";
import searchesRouter from "./searches";
import analyticsRouter from "./analytics";
import mapsProxyRouter from "./maps-proxy";

const router: IRouter = Router();

router.use(healthRouter);
router.use(leadsRouter);
router.use(searchesRouter);
router.use(analyticsRouter);
router.use(mapsProxyRouter);

export default router;
