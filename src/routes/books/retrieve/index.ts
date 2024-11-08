// src/routes/books/retrieve/index.ts
import express, { Router } from 'express';
import { retrieveRatingRouter } from './retrieveRating';
import { retrieveTitleRouter } from './retrieveTitle';
import { retrieveYearRouter } from './retrieveYear';
import { retrieveAuthorRouter } from './retrieveAuthor';
import { retrieveBooksRouter } from './retrieveBooks';
import { retrieveISBNRouter } from './retrieveISBN';

const retrieveRouter: Router = express.Router();

retrieveRouter.use(retrieveAuthorRouter);
retrieveRouter.use(retrieveBooksRouter);
retrieveRouter.use(retrieveISBNRouter);
retrieveRouter.use(retrieveRatingRouter);
retrieveRouter.use(retrieveTitleRouter);
retrieveRouter.use(retrieveYearRouter);

export { retrieveRouter };
