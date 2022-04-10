
const { body,validationResult } = require('express-validator');

var Book = require('../models/book');
var Author = require('../models/author');
var Genre = require('../models/genre');
var BookInstance = require('../models/bookinstance');

var async = require('async');
const { nextTick } = require('async');

exports.index = function(req, res) {

    async.parallel({
        book_count: function(callback) {
            Book.countDocuments({}, callback);
        },
        book_instance_count: function(callback) {
            BookInstance.countDocuments({}, callback);
        },
        book_instance_available_count: function(callback) {
            BookInstance.countDocuments({status:'Available'}, callback);
        },
        author_count: function(callback) {
            Author.countDocuments({}, callback);
        },
        genre_count: function(callback) {
            Genre.countDocuments({}, callback);
        }
    } , function(err, results) {
        res.render('index', {title: 'Local Library Home', error: err, data: results });
    });
//    res.send('NOT IMPLEMENTED: Site Home Page');
};

// Display list of all books.
exports.book_list = function(req, res, next) {
    Book.find({}, 'title author isbn')
        .sort({title : 1})
        .populate('author')
        .exec(function (err, list_books) {
            if (err) { return next(err); }
            res.render('book_list', {title: 'Book List', book_list: list_books})
        });
//    res.send('NOT IMPLEMENTED: Book list');
};

// Display detail page for a specific book.
exports.book_detail = function(req, res) {
    //res.send('NOT IMPLEMENTED: Book detail: ' + req.params.id);
    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id)
                .populate('author')
                .populate('genre')
                .exec(callback);
        },
        book_instance: function(callback) {
            BookInstance.find({ 'book': req.params.id })
                .exec(callback);
        },

    }, function(err, results) {
        if (err) { return next(err); }
        if (results.book==null) { // no results
            var err = new Error('book not found');
            err.status = 404;
            return next(err);
        }
        res.render('book_detail', {
            title: results.book.title,
            book: results.book,
            book_instances: results.book_instance
        });
        //console.log({title: results.book.title,book: results.book,book_instances: results.book_instance});

    });
};

// Display book create form on GET.
exports.book_create_get = function(req, res, next) {
//    res.send('NOT IMPLEMENTED: Book create GET');
    async.parallel({
        authors: function(callback) {
            Author.find(callback);
        },
        genres: function(callback) {
            Genre.find(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        res.render('book_form', {
            title: 'Create Book',
            authors: results.authors,
            genres: results.genres
        });
    });
};

// Handle book create on POST.
exports.book_create_post = [
//    function(req, res) { res.send('NOT IMPLEMENTED: Book create POST'); };
    (req, res, next) => {
//        console.log(req);
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === 'undefined') {
                req.body.genre = [];
            } else {
                req.body.genre = new Array(req.body.genre);
            }
        }
        next();
    },
    body('title', 'Title must not be empty.')
        .trim()
        .isLength({ min: 1})
        .escape(),
    body('author', 'Author must not be empty.')
        .trim()
        .isLength({ min: 1})
        .escape(),
    body('summary', 'Summary must not be empty.')
        .trim()
        .isLength({ min: 1})
        .escape(),
    body('isbn', 'ISBN must not be empty.')
        .trim()
        .isLength({ min: 1})
        .escape(),
    body('genre.*')
        .escape(),

    (req, res, next) => {

        const errors = validationResult(req);

        var book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre
        });
        if (!errors.isEmpty()) {
            console.log('found some errors');

            async.parallel({
                authors: function(callback) {
                    Author.find(callback);
                },
                genres: function(callback) {
                    Genre.find(callback);
                },
            }, function(err, results) {
                if (err) { return next(err); }
                for (let i=0; i<results.genre.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked='true';
                    }
                }
                res.render('book_form', {
                    title: 'Create Book',
                    authors: results.authors,
                    genres: results.genres,
                    book: book,
                    errors: errors.array()
                });
            });
            return;
        } else {

            book.save(function (err) {
                if (err) { return next(err); }
                res.redirect(book.url)
            })
        }
    }
]

// Display book delete form on GET.
exports.book_delete_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Book delete GET');
};

// Handle book delete on POST.
exports.book_delete_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Book delete POST');
};

// Display book update form on GET.
exports.book_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Book update GET');
};

// Handle book update on POST.
exports.book_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Book update POST');
};