import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { apiRouter } from './api';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Mount API routes
app.use('/api', apiRouter);

// Serve static frontend files if production build exists
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));

// For SPA routing
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    const indexPath = path.join(distPath, 'index.html');
    res.sendFile(indexPath, err => {
      if (err) next();
    });
  } else {
    next();
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Hostel Mess Management Server running on http://localhost:${PORT}`);
  });
}

export default app;
