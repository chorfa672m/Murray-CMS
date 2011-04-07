//  Murray CMS Helpers
var Db = require('mongodb').Db,
    Connection = require('mongodb').Connection,
    Server = require('mongodb').Server,
    BSON = require('mongodb').BSONNative;
var db = new Db('murray', new Server('127.0.0.1', 27017, {}));


/*
 *  Get Posts
 *  pulls all of the posts in 'posts' collection
 *  sends first 8 to be rendered reverse sorted by date
 *  checks if user is logged in
 */
exports.getposts = function(req,res,options,callback){

  var filters = {};
  if(options != undefined){
    if(options.pid != undefined){
      options.pid = parseFloat(options.pid);
    }
    filters = options;
  }
  var config = {'limit':8,'sort':[['date', -1]]};
  db.open(function(err, db){
    db.collection('posts', function(err, collection){
      collection.find(filters,config, function(err, cursor){
        cursor.toArray(function(err, posted){
          if(req.cookies.loggedin == 1){
            var logged = true;
          } else {
            var logged = false;
          }
          if(callback != ''){
          res.render('index.jade', {posts: posted, logged: logged});
          } else {
            callback();
          }
          db.close();
        });
      });
    });
  });
};
/*
 *  Create Post
 *  Looks for postcount for pid of new post
 *  adds date and pid to new post
 *  saves new post in murray.posts
 */
exports.createpost = function(req,res,newpost){
  var blogpost = req.body;
  db.open(function(err, db){
    db.collection('settings', function(err, collection){
      collection.find({'postcount':'num'}, function(err, cursor){
        cursor.toArray(function(err, posted){
          var postnum = posted[0].actual;
          blogpost.pid = postnum + 1;
          blogpost.date = new Date();
          blogpost.user = req.cookies.user;
          console.log(blogpost);
          db.collection('posts',function(err,collection){
              collection.insert([blogpost],function(err,docs){
                res.send('saved new post');
                collection.update(
                  {'postcount':'num'},
                  {'postcount':'num','actual':blogpost.pid}, 
                  function(err,docs){
                    db.close();
                  }
                );            
            });
          });
        });
      });
    });
  });
};
/*
 *  Login
 *  Handles checking username and password is correct
 *  and creates cookies
 */
exports.login = function(req,res){
  db.open(function(err, db){
    db.collection('users', function(err, collection){
      collection.find({}, function(err, cursor){
        cursor.toArray(function(err, users){
          for (var i = 0; i < users.length; i++){
            if(users[i].name == req.body.name && users[i].pass == req.body.password){
              res.cookie('loggedin', '1', 
                { path: '/', expires: new Date(Date.now() + 900000), httpOnly: true });
              res.cookie('user', req.body.name, 
                { path: '/', expires: new Date(Date.now() + 900000), httpOnly: true });
              res.send('You logged in!');  
            } else {
              res.send('sorry, try again');
            }
          }
          db.close();
        });
      });
    });
  });
};
/*
 *  Logout
 *  clears out loggedin and user cookie
 */
exports.logout = function(){
  res.clearCookie('loggedin','user' );
  res.send('logged out');
};

/*
 *  isIn
 *  Checks to see if the user is logged in
 *  returns the callback given
 */
exports.isIn = function(cookie, callback){
  if(cookie.loggedin == 1){
    callback();
  } else {
    res.send('you need to login for this');
  }
};