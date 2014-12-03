
/*
 * GET users listing.
 */

exports.list = function(req, res){
  res.send("Hola: "+SuperAdmin.name);
};