import express, { Router } from 'express';
import { deleteAuthorRouter } from './deleteAuthor';
import { deleteBookRouter } from './deleteISBN';
import { deleteYearRouter } from './deleteYear';
import { checkToken } from '../../../core/middleware';

const deleteRoutes: Router = express.Router();

deleteRoutes.use(checkToken, deleteBookRouter);
deleteRoutes.use(checkToken, deleteAuthorRouter);
deleteRoutes.use(checkToken, deleteYearRouter);

export { deleteRoutes };

