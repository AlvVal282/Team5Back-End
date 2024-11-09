import express, { Router } from 'express';

import { authRoutes } from './auth';
import { bookRoutes } from './books';

const routes: Router = express.Router();

routes.use(authRoutes);
routes.use(bookRoutes);

export { routes };