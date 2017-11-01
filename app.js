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
app.get('/restaurant/:id', function(req, res, next){
  var id = req.params.id
  var query = 'SELECT * FROM restaurant INNER JOIN review ON restaurant.id = review.restaurant_id INNER JOIN reviewer on review.reviewer_id = reviewer.id WHERE restaurant.id = $1'
  db.many(query, id)
    .then(function(result){
      console.log(result)
      res.render('restaurant.hbs', {result: result})
    })
    .catch(next)
});

app.listen(8000, function () {
  console.log('Listening on port 8000');
});
