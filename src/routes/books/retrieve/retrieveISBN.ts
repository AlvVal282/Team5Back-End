import express, { Request, Response, Router, NextFunction } from 'express';

import {
    pool,
    validationFunctions,
} from '../../../core/utilities';

const isISBNProvided = validationFunctions.isISBNProvided;

const retrieveISBNRouter: Router = express.Router();
/**
 * @api {get} /ISBN Request to retrieve an entry by ISBN
 *
 * @apiName GetISBN
 * @apiGroup retrieve
 *
 * @apiParam {Number} ISBN the ISBN in which we will look up
 *
 * @apiSuccess (Success 200) {number} Book_ID unique book id
 * @apiSuccess (Success 200) {INT} Publication_Year the year the book was published
 * @apiSuccess (Success 200) {String} Title the book title 
 * @apiSuccess (Success 200) {TEXT} Image_URL url of the books image 
 * 
 *
 * @apiError (400: Invalid ISBN) {String} message "Invalid or missing ISBN - please ensure that param is entered and is valid"
 * @apiError (404: ISBN Not Found) {String} message "ISBN Not Found"
 *
 */
retrieveISBNRouter.get(
    '/ISBN/:ISBN',
    (request: Request, response: Response, next: NextFunction) => {
        if(isISBNProvided(request.params.ISBN)) {
            next();
        } else {
            response.status(400).send({
                message: 'Invalid or missing ISBN - please ensure that param is entered and is valid',
            });
        }
    },

    (request: Request, response: Response) => {
        const theQuery = `
                SELECT * FROM Books
                WHERE ISBN13 = $1`;
        const values = [request.params.ISBN];

        pool.query(theQuery,values)
            .then((result) => {
                if (result.rowCount === 0 ) {
                    response.status(404).send({
                        message: 'ISBN Not Found',
                    });
                } else {
                    const book = result.rows[0];
                    response.status(200).json({
                        Book_ID: book.Book_ID,
                        Publication_Year: book.Publication_Year,
                        Title: book.Title,
                        Image_URL: book. Image_URL
                    });
                }
            })
            .catch((error) => {
                response.status(500).send({
                    message: 'Server error - DB error while trying to recieve a book by ISBN'
                });
            });
        }
); 

export { retrieveISBNRouter };

    
