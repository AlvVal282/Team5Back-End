import express, { Router } from 'express';
import { updateBookRouter } from './updateBooks';
import { updateRatingRouter } from './updateRating';

const updateRouter: Router = express.Router();

updateRouter.use(updateRatingRouter);
updateRouter.use(updateBookRouter);

export { updateRouter };
