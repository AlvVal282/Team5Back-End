import express, { Router } from 'express';
import { updateRouter } from './update';
import { createRouter } from './create';
import { checkToken } from '../../core/middleware';

const bookRoutes: Router = express.Router();

bookRoutes.use(checkToken, updateRouter);
bookRoutes.use(checkToken, createRouter);

export { bookRoutes };
