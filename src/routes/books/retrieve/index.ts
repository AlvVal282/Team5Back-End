// src/routes/books/retrieve/index.ts
import express, { Router } from 'express';
import { retrieveRatingRouter } from './retrieveRating';
import { retrieveTitleRouter } from './retrieveTitle';
import { retrieveYearRouter } from './retrieveYear';
import { retrieveAuthorRouter } from './retrieveAuthor';

const retrieveRouter: Router = express.Router();

retrieveRouter.use(retrieveAuthorRouter)
retrieveRouter.use(retrieveRatingRouter);
retrieveRouter.use(retrieveTitleRouter);
retrieveRouter.use(retrieveYearRouter);

export { retrieveRouter };
