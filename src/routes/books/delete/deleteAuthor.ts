import express, { Request, Response, Router, NextFunction } from 'express';
import { pool, validationFunctions } from '../../../core/utilities';

const isAuthorProvided = validationFunctions.isAlphabetical;

const deleteAuthorRouter: Router = express.Router();

/**
 * @api {delete} /author/:name Delete all books of an author
 *
 * @apiDescription Request to delete all books of an author by name
 *
 * @apiName DeleteAuthor
 * @apiGroup delete
 *
 * @apiParam {String} name The name of the author whose books will be deleted
 *
 * @apiSuccess (Success 200) {String} messageSuccess "All books of the author successfully deleted"
 *
 * @apiError (400: Missing or Invalid Author Name) {String} messageFailure "Missing or invalid author name - please ensure that the Author is entered and valid"
 * @apiError (404: Not Found) {String} messageNotFound "Author not found"
 *
 */

deleteAuthorRouter.delete(
    '/author/:name',
    (request: Request, response: Response, next: NextFunction) => {
        if (isAuthorProvided(request.params.name)) {
            next();
        } else {
            response.status(400).send({
                messageFailure: 'Missing or invalid author name - please ensure that the Author is entered and valid'
            });
        }
    },
    async (request: Request, response: Response) => {
        const authorName = request.params.name;

        try {
            const authorResult = await pool.query(
                'SELECT Author_ID FROM Authors WHERE Name = $1',
                [authorName]
            );
            if (authorResult.rowCount === 0) {
                return response.status(404).send({
                    messageNotFound: 'Author not found'
                });
            }
            const authorId = authorResult.rows[0].author_id;
            const deleteBooksResult = await pool.query(
                'DELETE FROM Books WHERE Book_ID IN (SELECT Book_ID FROM Book_Author WHERE Author_ID = $1)',
                [authorId]
            );
            await pool.query('DELETE FROM Authors WHERE Author_ID = $1', [authorId]);
            response.status(200).send({
                messageSuccess: 'All books of the author successfully deleted',
            });
        } catch (error) {
            response.status(500).send({
                message: 'An error occurred while trying to delete the author and associated books',
                error: error.message
            });
        }
    }
);
export { deleteAuthorRouter };
