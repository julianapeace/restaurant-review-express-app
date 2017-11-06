const express = require('express');
const app = express();
const pgp = require('pg-promise')({});
const db = pgp({database: 'restaurantv2'});
const session = require('express-session');
const morgan = require('morgan');
const body_parser = require('body-parser');

app.set('view engine', 'hbs');
app.use(morgan('dev'));
app.use(body_parser.urlencoded({extended: false}));
app.use(express.static('public'));

app.use(session({
  secret: process.env.SECRET_KEY || 'dev',
  resave: true,
  saveUninitialized: false,
  cookie: {maxAge: 60000}
}));

app.use(function (req, res, next) {
  if (req.session.user) {
    next();
  } else if (req.path == '/login') {
    next();
  } else {
    res.redirect('/login');
  }
});

app.get('/login', function(req,res){
  res.render('login.hbs');
});

app.post('/login', function(req,res, next){
  var data = {reviewer_email : req.body.username, password: req.body.password}

  var query = "SELECT EXISTS(select 1 FROM reviewer WHERE reviewer_email = ${reviewer_email} AND password = ${password})"
  db.one(query, data)
    .then(function(result){
      if(result['exists']=== false){
        console.log('user does not exist')
        var error = "Username or password is incorrect."
        res.render('login.hbs', {'error':error})
      }
      else{
        console.log('user exists')
        req.session.user = req.body.username; //creates secure cookie with encrypted username
        res.redirect('/')
      }
    })
    .catch(next);
});

app.get('/', function(req, res, next){
  var user_data = {reviewer_email: req.session.user}
  var query = 'SELECT * FROM reviewer WHERE reviewer_email = ${reviewer_email}'
  db.one(query, user_data)
    .then(result => {
      let name = result['reviewer_name']
      res.render('index.hbs', {'name':name});
    })
    .catch(next);
});
app.get('/search', function(req, res, next){
  //with GET forms, you should be getting the parameters from the query. not the body -.-;
  var searchTerm = req.query.searchTerm;
  var query = "SELECT * FROM restaurant WHERE \
  restaurant.restaurant_name ILIKE '%$1#%'"
  db.any(query, searchTerm)
    .then(function(resultsArray) {
      res.render('search_results.hbs', {
        results: resultsArray
      });
    })
    .catch(next);
});
app.get('/restaurant/new', function(req, res){
  res.render('add-restaurant.hbs')
});
app.post('/restaurant/submit_new', function(req, res, next){
  var data = {restaurant_name: req.body.name, restaurant_address: req.body.address, restaurant_category: req.body.category}
  var query = "INSERT INTO restaurant \
        VALUES (default, ${restaurant_name}, ${restaurant_address}, ${restaurant_category}) RETURNING id";
  db.one(query, data)
    .then(function(result){
      res.redirect('/restaurant/'+ result.id)
      // console.log(result.id)
    })
    .catch(next)
});
app.get('/restaurant/:id', function(req, res, next){
  var id = req.params.id
  var query = 'SELECT * FROM restaurant LEFT JOIN review ON restaurant.id = review.restaurant_id LEFT JOIN reviewer on review.reviewer_id = reviewer.id WHERE restaurant.id = $1'
  db.any(query, id)
    .then(function(result){
      console.log(result)
      if (result.length == 0){
        var error = true;
        res.render('restaurant.hbs', {error: error})
      }
      else{
        var error = false;
        res.render('restaurant.hbs', {result: result, error: error})
      }
    })
    .catch(next)
});

app.post('/addreview', function(req, res, next){
  //get the reviewer ID first,
  var user_data = {reviewer_email: req.session.user}
  var user_query = 'SELECT * FROM reviewer WHERE reviewer_email = ${reviewer_email}'
  db.one(user_query, user_data)
    .then(function(result){
      console.log(result['id'])
      return result['id']
    })
    .then(function(id){
      var data = {reviewer_id: id, review_stars: req.body.stars, review_title: req.body.title, review: req.body.review, restaurant_id: req.body.restaurant_id}
      var restaurant_id = req.body.restaurant_id
      var restaurant_name = req.body.restaurant_name
      var query = 'INSERT INTO review \
      VALUES (default, ${reviewer_id}, ${review_stars}, ${review_title}, ${review}, ${restaurant_id})'
    console.log(data)
      db.result(query, data)
        .then(function(result){
          console.log(result)
          res.redirect('/restaurant/'+ restaurant_id)
        })
        .catch(next)
    })
    .catch(next);

});

app.listen(8000, function () {
  console.log('Listening on port 8000');
});
