import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import resourcesRouter from './routes/resources.js';
import ordersRouter from './routes/orders.js';
import teacherRouter from './routes/teacher.js';
import tutorsRouter from './routes/tutors.js';
import adminRouter from './routes/admin.js';
import announcementsRouter from './routes/announcements.js';
import paymentsRouter from './routes/payments.js';
import subscriptionsRouter from './routes/subscriptions.js';
import notificationsRouter from './routes/notifications.js';
import settingsRouter from './routes/settings.js';

const app = express();

// Reflects the request origin rather than a fixed CLIENT_ORIGIN, since
// this now serves both the production Vercel domain and any preview
// deployment URL Vercel generates per branch/PR — a fixed origin would
// break CORS on every preview link.
app.use(
  cors({
    origin: true,
    credentials: false,
  })
);
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/resources', resourcesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/teacher', teacherRouter);
app.use('/api/tutors', tutorsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/announcements', announcementsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/settings', settingsRouter);

// Keep server errors from leaking internals to the client. Logged
// server-side (Vercel captures this in the function's logs) rather than
// sent to the browser.
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Something went wrong. Try again.' });
});

export default app;
