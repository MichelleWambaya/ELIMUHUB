// Used only by `npm run dev:api` for local development. Vercel never runs
// this file — in production, /api/[...all].js imports app.js directly and
// Vercel's Node runtime handles the listening.
import app from './app.js';

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`ElimuHub API running locally on port ${port}`));
