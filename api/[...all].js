// Vercel's [...all] filename is its native catch-all convention: any
// request to /api/anything lands here with no vercel.json routing config
// needed. Express apps are themselves valid (req, res) handlers, so the
// whole existing app can be exported directly — no serverless-http shim
// required, no rewrite of routes into separate files.
import app from '../api-server/app.js';

export default app;
