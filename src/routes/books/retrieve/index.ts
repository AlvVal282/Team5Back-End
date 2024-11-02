// src/routes/books/retrieve/index.ts
import express, { Router } from 'express';
import { retrieveRatingRouter } from './retrieveRating';
import { retrieveTitleRouter } from './retrieveTitle';
import { retrieveYearRouter } from './retrieveYear';

const retrieveRouter: Router = express.Router();

retrieveRouter.use(retrieveRatingRouter);
retrieveRouter.use(retrieveTitleRouter);
retrieveRouter.use(retrieveYearRouter);

export { retrieveRouter };
