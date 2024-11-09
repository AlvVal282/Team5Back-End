// src/routes/books/index.ts
import express, { Router } from 'express';
import { retrieveRouter } from './retrieve';
import { deleteRoutes } from './delete';
import { createRouter } from './create';
import { updateRouter } from './update';
import { checkToken } from '../../core/middleware';

const bookRoutes: Router = express.Router();

bookRoutes.use('/retrieve', retrieveRouter);
bookRoutes.use('/delete', deleteRoutes);

export { bookRoutes };
