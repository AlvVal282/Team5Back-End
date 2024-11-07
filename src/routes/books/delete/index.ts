import express, { Router } from 'express';
import { deleteAuthorRouter } from './deleteAuthor';
import { deleteBookRouter } from './deleteISBN';
import { deleteYearRouter } from './deleteYear';

const deleteRoutes: Router = express.Router();

deleteRoutes.use('/delete', deleteBookRouter);
deleteRoutes.use('/delete', deleteAuthorRouter);
deleteRoutes.use('/delete', deleteYearRouter);

export { deleteRoutes };

