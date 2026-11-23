import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { apiRouter } from './server/api';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'express-backend',
      configureServer(server) {
        const app = express();
        app.use(cors({ origin: true, credentials: true }));
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        app.use(cookieParser());
        app.use('/api', apiRouter);

        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.startsWith('/api')) {
            app(req as any, res as any, next);
          } else {
            next();
          }
        });
      }
    }
  ],
  server: {
    port: 5173,
    host: true
  }
});
