import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middlewares/error';
import { stream } from './utils/logger';

const app = express();

app.use(helmet());
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map(url => url.trim());
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
app.use(express.json());

// Log HTTP requests
app.use(morgan('tiny', { stream }));

import routes from './routes/index';
import { spapiCallback } from './controllers/spapi-callback.controller';

// Mount generic resource routes here
app.use('/api', routes);

// SP-API OAuth callback at root level (matches AMZN_SP_REDIRECT_URI)
app.get('/callback', spapiCallback);

// Standard Health Check
app.get('/health', (req, res) => res.status(200).send('OK'));

app.use(errorHandler);

export default app;
