import express, { Router } from 'express';
import { createBookRouter } from './createBook';

const createRouter: Router = express.Router();

createRouter.use(createBookRouter);

export { createRouter };
