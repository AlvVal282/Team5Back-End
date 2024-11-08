import express, { Router } from 'express';
import { deleteAuthorRouter } from './deleteAuthor';
import { deleteBookRouter } from './deleteISBN';
import { deleteYearRouter } from './deleteYear';
import { checkToken } from '../../../core/middleware';

const deleteRoutes: Router = express.Router();

deleteRoutes.use('/delete', checkToken, deleteBookRouter);
deleteRoutes.use('/delete', checkToken, deleteAuthorRouter);
deleteRoutes.use('/delete', checkToken, deleteYearRouter);

export { deleteRoutes };

