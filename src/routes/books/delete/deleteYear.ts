import express, { Request, Response, Router, NextFunction } from 'express';

import {
    pool,
    validationFunctions,
} from '../../../core/utilities';

const isYearProvided = validationFunctions.isAuthorOrYearProvided;

const deleteYearRouter: Router = express.Router();

/**
 * @api {delete} /year/:year Delete a specified year
 *
 * @apiDescription Request to delete all books associated of a specific publication year from the database.
 *
 * @apiName DeleteYear
 * @apiGroup delete
 *
 * @apiParam {Number} year The publication year to delete
 *
 * @apiSuccess (Success 200) {String} messageSuccess "All books associated with publication year successfully deleted"
 *
 * @apiError (400: Missing Year) {String} messageFailure "Missing or invalid year parameter  - please ensure the publication year is entered and/or correctly formatted"
 * @apiError (404: Year Not Found) {String} messageNotFound "No books found for the specified publication year"
 * 
 */

deleteYearRouter.delete(
    '/year/:year',
    (request: Request, response: Response, next: NextFunction) => {
        if (isYearProvided(request.params.year)) {
            next();
        } else {
            response.status(400).send({
                messageFailure: 'Missing or invalid year parameter  - please ensure the publication year is entered and/or correctly formatted'
            });
        }
    },
    (request: Request, response: Response) => {
        const theQuery = 'DELETE FROM Books WHERE Publication_Year = $1';
        const values = [request.params.year];

        pool.query(theQuery, values)
            .then((result) => {
                if (result.rowCount === 0) {
                    response.status(404).send({
                        message: `No books found for the specified publication year`
                    });
                } else{
                    response.status(200).send({
                        messageSuccess: 'All books associated with publication year successfully deleted'
                    });
                }
            })
            .catch((error) => {
                response.status(500).send({
                    message: 'An error occurred while trying to delete book',
                    error: error.message
                });
            });
    }
);

export { deleteYearRouter };