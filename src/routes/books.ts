import { NextFunction, Request, Response, Router } from "express";
import * as _ from 'lodash';

import { BookFactory } from '../model/book-factory';
import { BooksStore } from '../books-store';
import { HTTP } from './http';

export class BooksRoute {

  public static create(router: Router, bookStore: BooksStore) {

    let booksRoute = new BooksRoute(bookStore);
    let methodsToBind = [
      'getAll', 'getAllBySearch', 'reset', 'create',
      'rate', 'getByISBN', 'checkISBN', 'update', 'delete']
    _.bindAll(booksRoute, methodsToBind);

    router.get('/', booksRoute.getAll);
    router.get('/search/:search', booksRoute.getAllBySearch);
    router.delete('/', booksRoute.reset);
    router.post('/', booksRoute.create);
    router.post('/:isbn/rate', booksRoute.rate);
    router.get('/:isbn', booksRoute.getByISBN);
    router.get('/:isbn/check', booksRoute.checkISBN);
    router.put('/:isbn', booksRoute.update);
    router.delete('/:isbn', booksRoute.delete);
  }

  constructor(private store: BooksStore) {  }

  // GET /books
  getAll(req: Request, res: Response, next: NextFunction) {
    res.json(this.store.getAll());
    next();
  };

  getAllBySearch(req: Request, res: Response, next: NextFunction) {

    let searchTerm = req.params.search;

    res.json(this.store.getAllBySearch(searchTerm));
    next();
  };

  getByISBN(req: Request, res: Response, next: NextFunction) {

    let isbn = req.params.isbn;
    let book = this.store.getByIsbn(isbn);

    if (!book) {
      return res.status(HTTP.NOT_FOUND).send('Book does not exist');
    }

    res.json(book);
    next();
  };

  checkISBN(req: Request, res: Response, next: NextFunction) {

    let isbn = req.params.isbn;
    let bookExist = this.store.isbnExists(isbn);

    res.json(bookExist);
    next();
  };

  create(req: Request, res: Response, next: NextFunction) {

    let bookJson = req.body;
    let isbn = bookJson.isbn;

    if (!isbn) {
      return res.status(HTTP.BAD_REQUEST).send('Invalid data: ISBN number is mandatory');
    }

    if (this.store.isbnExists(isbn)) {
      return res.status(HTTP.CONFLICT).send('Book does already exist');
    }

    let book = BookFactory.fromJson(bookJson);
    this.store.create(book)

    res.send(HTTP.CREATED);
    next();
  };

  update(req: Request, res: Response, next: NextFunction) {

    let bookJson = req.body;
    let isbn = bookJson.isbn;

    if (!isbn) {
      return res.status(HTTP.BAD_REQUEST).send('Invalid data: ISBN number is mandatory');
    }

    if (req.params.isbn != isbn) {
      return res.status(HTTP.BAD_REQUEST).send('Invalid data: ISBN from query and body must match');
    }

    if (!this.store.isbnExists(isbn)) {
      return res.status(HTTP.NOT_FOUND).send('Book does not exist');
    }

    let book = BookFactory.fromJson(bookJson);
    this.store.update(book)

    res.send(HTTP.OK);
    next();
  };

  delete(req: Request, res: Response, next: NextFunction) {

    let isbn = req.params.isbn;
    this.store.delete(isbn);

    res.send(HTTP.OK);
    next();
  };

  reset(req: Request, res: Response, next: NextFunction) {

    this.store.reset();

    // reset() can be also called without params!
    if (res && next) {
      res.send(HTTP.OK);
      next();
    }
  };

  rate(req: Request, res: Response, next: NextFunction) {

    let isbn = req.params.isbn;
    let rating = req.body.rating;

    if (!rating && rating !== 0) {
      return res.status(HTTP.BAD_REQUEST).send('Invalid data: rating is mandatory');
    }

    let book = this.store.getByIsbn(isbn);

    if (!book) {
      return res.status(HTTP.NOT_FOUND).send('Book does not exist');
    }

    book.rating = BookFactory.normalizeRating(rating);

    res.send(HTTP.OK);
    next();
  };

}