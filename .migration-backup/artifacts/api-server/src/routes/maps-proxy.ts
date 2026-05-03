import { Router, type IRouter } from "express";
import https from "https";

const router: IRouter = Router();

const GOOGLE_APIS_HOST = "maps.googleapis.com";

function proxyRequest(targetPath: string, query: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = `https://${GOOGLE_APIS_HOST}${targetPath}?${query}`;
    https
      .get(url, (apiRes) => {
        let data = "";
        apiRes.on("data", (chunk: Buffer) => (data += chunk.toString()));
        apiRes.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

router.get("/maps-proxy", async (req, res): Promise<void> => {
  const pathParam = typeof req.query.path === "string" ? req.query.path : "";

  const allowedPaths = [
    "/maps/api/place/nearbysearch/json",
    "/maps/api/place/details/json",
    "/maps/api/geocode/json",
  ];

  if (!allowedPaths.includes(pathParam)) {
    res.status(400).json({ error: "Invalid path" });
    return;
  }

  const forwardParams = new URLSearchParams();
  for (const [k, v] of Object.entries(req.query)) {
    if (k !== "path" && typeof v === "string") {
      forwardParams.append(k, v);
    }
  }

  try {
    const raw = await proxyRequest(pathParam, forwardParams.toString());
    res.setHeader("Content-Type", "application/json");
    res.send(raw);
  } catch (err) {
    res.status(502).json({ error: "Upstream request failed" });
  }
});

export default router;
