var express = require('express');
var app = express();
var pgp = require('pg-promise')({});
var db = pgp({database: 'restaurantv2'});

const body_parser = require('body-parser');
app.use(body_parser.urlencoded({extended: false}));
app.set('view engine', 'hbs');
app.use(express.static('public'));

app.get('/', function(req, res){
  res.render('index.hbs');
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
  var query = 'SELECT * FROM restaurant FULL JOIN review ON restaurant.id = review.restaurant_id FULL JOIN reviewer on review.reviewer_id = reviewer.id WHERE restaurant.id = $1'
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
  var data = {review_stars: req.body.stars, review_title: req.body.title, review: req.body.review, restaurant_id: req.body.restaurant_id}
  var restaurant_id = req.body.restaurant_id
  var restaurant_name = req.body.restaurant_name
  var query = 'INSERT INTO review \
  VALUES (default, NULL, ${review_stars}, ${review_title}, ${review}, ${restaurant_id})'
console.log(data)
  db.result(query, data)
    .then(function(result){
      console.log(result)
      res.redirect('/restaurant/'+ restaurant_id)
    })
    .catch(next)
});

app.listen(8000, function () {
  console.log('Listening on port 8000');
});
