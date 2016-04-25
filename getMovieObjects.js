const movieObj = require(`./movieObj`);
const fs = require("fs");

var scriptIds = [111, 113, 115];

var movies = {};

for (script in scriptIds){
  id = scriptIds[script];
  movie = movieObj[id];
  movies[id] = movie;
}

var str = JSON.stringify(movies, null, 2);

fs.writeFile('final_movies.js', str);