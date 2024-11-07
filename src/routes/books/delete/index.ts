import express, { Router } from 'express';
import { deleteAuthorRouter } from './deleteAuthor';
import { deleteBookRouter } from './deleteISBN';
import { deleteYearRouter } from './deleteYear';

const deleteRoutes: Router = express.Router();

deleteRoutes.use(deleteBookRouter, deleteAuthorRouter, deleteYearRouter);

export { deleteRoutes };

