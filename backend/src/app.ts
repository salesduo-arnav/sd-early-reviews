import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middlewares/error';
import { stream } from './utils/logger';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Log HTTP requests
app.use(morgan('tiny', { stream }));


app.use(express.json());

import routes from './routes/index';

// Mount generic resource routes here
app.use('/api', routes);

// Standard Health Check
app.get('/health', (req, res) => res.status(200).send('OK'));

app.use(errorHandler);

export default app;
