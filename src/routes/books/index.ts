// src/routes/books/index.ts
import express, { Router } from 'express';
import { retrieveRouter } from './retrieve';
import { checkToken } from '../../core/middleware';

const bookRoutes: Router = express.Router();

bookRoutes.use(retrieveRouter, checkToken);

export { bookRoutes };
