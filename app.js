
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , superadmin = require('./routes/superadmin')
  , admin = require('./routes/admin')
  ,	mongoose = require('mongoose')
  , vendedor = require('./routes/vendedor')
  , pedido = require('./routes/pedido')
  , http = require('http')
  , path = require('path')
  , mail = require('./classes/mail_sender');

var app = express();
// all environments
var apn = require('apn');

app.set('port', process.env.PORT || 1513);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(require('less-middleware')({ src: __dirname + '/public' }));
app.use(express.static(path.join(__dirname, 'public')));

//mongoose.connect("mongodb://localhost/sweetwater");
mongoose.connect("mongodb://iAmUser:iAmStudio1@ds037478.mongolab.com:37478/sweetwater");
//mongoose.connect("mongodb://iAmUser:iAmStudio1@ds049898.mongolab.com:49898/development");

var SuperAdminSchema= new mongoose.Schema({
	name: String,
	email: String,
	password: String,
	admins: Array
}),
	SuperAdmin= mongoose.model('SuperAdmin',SuperAdminSchema);
var AdminSchema= new mongoose.Schema({
	name: String,
	email: String,
	password: String,
	type: String,
	token: {type: String,required: false,unique: false,},
	vendors: Array
}),
	Admin= mongoose.model('Admin',AdminSchema);
var VendorSchema= new mongoose.Schema({
	vendorName: {type: String,required: true,unique: true,},
	vendorEmail: {type: String,required: true,unique: true,},
	vendorPassword: {type: String,required: true,unique: false,},
	type: String,
	token: {type: String,required: false,unique: false,},
	vendorAdminId: String,
	vendorIsActive: Number,
	vendorLatitude: {type: String,required: false,unique: false,},
	vendorLongitude: {type: String,required: false,unique: false,},
	lastPositionDate: {type: Date,required: false,unique: false,},
	batteryLevel: {type: String,required: false,unique: false,},
	batteryState:{type: String,required: false,unique: false,},
	discSpaceAvailable:{type: String,required: false,unique: false,},
	carrier:{type: String,required: false,unique: false,},
	model:{type: String,required: false,unique: false,},
	deviceName:{type: String,required: false,unique: false,},
	systemVersion:{type: String,required: false,unique: false,}
}),
	Vendor= mongoose.model('Vendor',VendorSchema);
var ProductSchema= new mongoose.Schema({
	productName: String,
	productReference: String,
	productQuantity: Number,
	productCode: String,
	productIdCopy: String
}),
	Product= mongoose.model('Product',ProductSchema);
var DeliverySchema= new mongoose.Schema({
	deliveryAdminId: String,
	deliveryUserId: {type: String,required: true,unique: false,},
	deliveryVendorId: {type: String,required: false,unique: false,},
	deliveryAnnotation: String,
	deliveryPriority: Number,
	deliveryIsDelivered: Number,
	deliveryCreationDate: Date,
	deliveryDate: {type: Date,required: false,unique: false,},
	deliveryDeadline: {type: Date,required: false,unique: false,},
	deliveryWaterQuantity:Number,
	deliveryIceQuantity:Number,
	deliveryWaterGalQuantity: Number,
	deliveryLittleWaterQuantity: Number,
	deliveryLittleIceQuantity: Number,
	deliveryLatitude: {type: String,required: false,unique: false,},
	deliveryLongitude: {type: String,required: false,unique: false,},
	deliveryDeliveredTo: {type: [UserSchema],required: false,unique: false,},
}),
	Delivery= mongoose.model('Delivery',DeliverySchema);
var UserSchema= new mongoose.Schema({
	userName: {type: String,required: true,unique: false,},
	type: String,
	userPhone: String,
	userAddress: String,
	userDeliveries: [DeliverySchema],
	userIndication: String,
	userLatitude: String,
	userLongitude: String,
	userVendorId: String,
	userVendorName: String,
	userIsActive: Number,
	userLastDeliveryDate: {type: Date,required: false,unique: false,},
	userActiveDeliveries: Number,
	userTotalPositiveDeliveries: Number,
	userTotalCanceledDeliveries: Number,
	userBusiness: Number,
}),
	User= mongoose.model('User',UserSchema);

function sendPush(message,token,action){

	var options = { "gateway": "gateway.sandbox.push.apple.com" };
    var apnConnection = new apn.Connection(options);
    var myDevice = new apn.Device(token);
    var note = new apn.Notification();

	note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
	note.badge = 1;
	note.sound = "ping.aiff";
	note.alert = message;
	note.payload = {'action': action};
	
	apnConnection.pushNotification(note, myDevice);
	//feedbackFunction();
};
function feedbackFunction(){
	var options = {
	    "batchFeedback": true,
	    "interval": 10
	};
	var feedback = new apn.Feedback(options);
	feedback.on("feedback", function(devices) {
	    devices.forEach(function(item) {
	    });
	});

}
function updateVendorDeviceInfo(idIn,tokenIn,latIn,lonIn,batteryLevelIn,batteryStateIn,discIn,carrierIn,modelIn,deviceNameIn,systemVersionIn){
nowDate=Date.now();
	Vendor.findOneAndUpdate({_id:idIn},
						  {$set:{token: tokenIn,
						  		  vendorLatitude:latIn,
						  		  vendorLongitude:lonIn,
						  		  lastPositionDate:nowDate,
						  		  batteryLevel: batteryLevelIn,
						  		  batteryState:batteryStateIn,
						  		  discSpaceAvailable:discIn,
						  		  carrier:carrierIn,
						  		  model:modelIn,
						  		  deviceName:deviceNameIn,
						  		  systemVersion:systemVersionIn}},
						  function(err, vendor){
						  if(err){

						  }
						  else{
						  }
						  });
};
function gmtNowDate(){
	UTCDate = new Date();
	GMTDate = new Date(UTCDate.getFullYear(), UTCDate.getMonth(), UTCDate.getDate(), UTCDate.getHours()-5, UTCDate.getMinutes(), 0, 0);
	return GMTDate;
}
function getWholeDayFrom(numberOfDaysAgo){
	
	twoDaysAgo= new Object();
	date= gmtNowDate();
	year=date.getFullYear();
	mes=date.getMonth();
	dia=date.getDate()-numberOfDaysAgo;
	hora=date.getHours();
	minutos=date.getMinutes();
	twoDaysAgo.date=date;
	twoDaysAgo.start=new Date(year,mes,dia,0,0);
	twoDaysAgo.finish=new Date(year,mes,dia,23,59);
	
	//console.log('día '+dia+' hora '+hora+':'+minutos);
	//console.log('fecha overrided '+test);
	return twoDaysAgo;
}
function getPossibleUsersForToday(vendorEmail,start,finish){
	User.find({userVendorId:vendorEmail,userLastDeliveryDate:{$gte:start,$lt:finish}},
					  function(err,users){
							 if(err){
							 	return err;
						 	}
						 	else{
						 		
						 	}
					 }); 
}

//CREATE
app.post("/CreateAdmin", function(req,res){
	new Admin({
		name:req.body.adminName,
		email:req.body.adminEmail,
		password:req.body.adminPassword,
		type: 'admin',
	}).save(function(err,admin){
		if(err) res.json(err);
		res.send(admin);
	});
});
app.post("/CreateVendor", function(req,res){
Vendor.findOne({vendorEmail:req.body.vendorEmail}, function(err,vendor){
		if(vendor){
		var objToJson = { };
		objToJson.response = "Ya existe un vendedor con este correo electrónico.";
		res.send(JSON.stringify(objToJson));
			return;
		}		
		else{
			new Vendor({
				vendorName:req.body.vendorName,
				vendorEmail:req.body.vendorEmail,
				vendorPassword:req.body.vendorPassword,
				vendorAdminId:req.body.vendorAdminId,
				token: "",
				vendorLatitude: "",
				vendorLongitude: "",
				type: 'vendor',
				vendorIsActive:1,
				}).save(function(err,vendor){
					if(err) res.json(err);
					res.send(vendor);
			});
		}
	});
});
app.post("/CreateUser", function(req,res){
	if(req.body.userName=="No"){
		var objToJson = { };
		objToJson.response = "Debes al menos poner un nombre.";
		res.send(JSON.stringify(objToJson));
		return;
	}
	else if(req.body.userVendorId=="No"){
		var objToJson = { };
		objToJson.response = "El usuario no puede ser creado sin un Vendedor asignado.";
		res.send(JSON.stringify(objToJson));
		return;
	}
	/*
else if(req.body.userIndication=="No"){
		var objToJson = { };
		objToJson.response = "Debe crear una indicación.";
		res.send(JSON.stringify(objToJson));
		return;
	}
*/
	new User({
		userName:req.body.userName,
		userPhone:req.body.userPhone,
		userAddress:req.body.userAddress,
		userIndication:req.body.userIndication,
		type: 'user',
		userLatitude:req.body.userLatitude,
		userLongitude:req.body.userLongitude,
		userVendorId:req.body.userVendorId,
		userVendorName:req.body.userVendorName,
		userIsActive:req.body.userIsActive,
		userTotalPositiveDeliveries:0,
		userTotalCanceledDeliveries:0,
		userActiveDeliveries:0,
		userBusiness:req.body.userBusiness,
	}).save(function(err,user){
		if(err) res.json(err);
		res.send(user);
	});
}); 
/*
app.post("/CreateDelivery", function(req,res){
	nowDate=new Date();
	var aDelivery=new Delivery({
		deliveryAdminId:req.body.adminId,
		deliveryUserId:req.body.userId,
		deliveryAnnotation: req.body.annotation,
		deliveryPriority: req.body.priority,
		deliveryIsDelivered: 0,
		deliveryCreationDate: nowDate,
		deliveryDeadline: req.body.deadline,
		deliveryWaterQuantity:req.body.waterQuantity,
		deliveryIceQuantity:req.body.iceQuantity
	});
		aDelivery.save(function(err,delivery){
		if(err){ 
			res.json(err);
		}
		else{
			User.findOneAndUpdate({'_id':req.body.userId},{$push:{userDeliveries:aDelivery},$inc:{userActiveDeliveries:1}}, function (err,user) {
			if (err) {
				res.json(err);
			}
			else{
			Vendor.findOne({_id:user.userVendorId}, function(err,vendor){
			if(err){
				res.json(err);
			}
			else{
				sendPush("Tienes un nuevo pedido pendiente por entregar.",vendor.token,'pedido nuevo');
				res.format({
					html: function () { res.send('Nada por html, este contenido solo puede ser visualizado desde una interfaz'); },
					json: function () { res.send(user); },
				});
			}
			});
			}
		});		
		}
	});
});
*/
app.post("/CreateDelivery", function(req,res){
	nowDate=new Date();
	var aDelivery=new Delivery({
		deliveryAdminId:req.body.adminId,
		deliveryUserId:req.body.userId,
		deliveryAnnotation: req.body.annotation,
		deliveryPriority: req.body.priority,
		deliveryIsDelivered: 0,
		deliveryCreationDate: nowDate,
		deliveryDeadline: req.body.deadline,
		deliveryWaterQuantity:req.body.waterQuantity,
		deliveryIceQuantity:req.body.iceQuantity,
		deliveryWaterGalQuantity:req.body.waterGalQuantity,
		deliveryLittleWaterQuantity:req.body.littleWaterQuantity,
		deliveryLittleIceQuantity:req.body.littleIceQuantity
	});
		aDelivery.save(function(err,delivery){
		if(err){ 
			res.json(err);
		}
		else{
			User.findOneAndUpdate({'_id':req.body.userId},{$inc:{userActiveDeliveries:1}}, function (err,user) {
				if (!user) {
					res.json(err);
				}
				else{
					if(user.userVendorName=="cualquiera"){
						Vendor.find({}, function(err,vendors){
							if(!vendors){
								
							}
							else{
								for(var i=0;i<vendors.length;i++){
									sendPush("Pedido:."+user.userIndication,vendors[i].token,'pedido nuevo');
									//console.log("Vendedor que entrega: "+vendors[i].vendorName);
								}
								res.format({
									html: function () { res.send('Nada por html, este contenido solo puede ser visualizado desde una interfaz'); },
									json: function () { res.send(user); },
								});
							}
						});
					}
					else{
						Vendor.findOne({_id:user.userVendorId}, function(err,vendor){
							if(!vendor){
								res.json(err);
								}
							else{
								sendPush("Pedido:."+user.userIndication,vendor.token,'pedido nuevo');
								res.format({
									html: function () { res.send('Nada por html, este contenido solo puede ser visualizado desde una interfaz'); },
									json: function () { res.send(user); },
								});
							}
						});
					}
				}
			});		
		}
	});
});
app.post("/CreateExpressDelivery", function(req,res){
	nowDate=new Date();
	var aDelivery=new Delivery({
		deliveryAdminId:req.body.adminId,
		deliveryVendorId:req.body.adminId,
		deliveryUserId:req.body.userId,
		deliveryAnnotation: 'Express',
		deliveryPriority: 0,
		deliveryIsDelivered: 1,
		deliveryCreationDate: nowDate,
		deliveryDate: nowDate,
		deliveryDeadline: 0,
		deliveryLatitude:req.body.deliveryLatitude,
		deliveryLongitude:req.body.deliveryLongitude,
		deliveryWaterQuantity:req.body.waterQuantity,
		deliveryIceQuantity:req.body.iceQuantity,
		deliveryWaterGalQuantity:req.body.waterGalQuantity,
		deliveryLittleWaterQuantity:req.body.littleWaterQuantity,
		deliveryLittleIceQuantity:req.body.littleIceQuantity
	});
		aDelivery.save(function(err,delivery){
		if(err){ 
			res.json(err);
		}
		else{
			User.findOneAndUpdate({'_id':req.body.userId},{$set:{userLastDeliveryDate:nowDate}}, function (err,user) {
			if (!user) {
				res.json(err);
			}
			else{
				Delivery.findOneAndUpdate({_id:delivery._id},{$set:{deliveryDeliveredTo:user,deliveryDate:nowDate}},function(err,deliverie){
					if(!deliverie){
					//console.log("delivery id "+delivery._id);
						res.json(err);
					}
					else{
						res.json({response:"Ok"});
					}
				});

				return;
			}
		});		
		}
	});
});
/*
app.post("/CreateProduct", function(req,res){
		var aProduct=new Product({
		productName: req.body.productName,
		productReference: req.body.productReference,
		productCode: req.body.productCode,
	}).save(function(err,product){
		if(err) res.json(err);		
			res.send(product);
	});
});
*/


app.get("/GetDate", function(req,res){
	getTwoDaysAgo();
});
//GET
app.get("/GetTodayPossibleCustomersForVendor/:vendorId/:vendorPassword/:daysBack", function(req,res){
	//date=getWholeDayFrom(req.params.daysBack);
	var date=getWholeDayFrom(2);
	var date2=getWholeDayFrom(4);
	//console.log(date.start);
	//console.log(date2.start);
	User.find({userVendorId:req.params.vendorId,userLastDeliveryDate:{$gte:date2.start,$lt:date.finish}},
			  null,
			  {sort:{userLastDeliveryDate:1}},
					  function(err,users){
							 if(err){
							 	return err;
						 	}
						 	else{
						 		res.send(users);
						 	}
					 }); 
			
});
app.get("/GetAdmin/:adminEmail/:adminPassword", function(req,res){
	Admin.findOne({email:req.params.adminEmail}, function(err,admin){
	if(!admin){
		var objToJson = { };
		objToJson.response = "User doesn't exist";
		res.send(JSON.stringify(objToJson));
			return;
		}
	if(admin.email == req.params.adminEmail && admin.password == req.params.adminPassword){
	   res.send(admin); 
	}
	else{
		var objToJson = { };
		objToJson.response = "Wrong password";
		res.send(JSON.stringify(objToJson));
		}
	});
});
app.get("/GetVendor/:vendorEmail/:vendorPassword", function(req,res){
		Vendor.findOne({vendorEmail:req.params.vendorEmail}, function(err,vendor){
		if(!vendor){
		var objToJson = { };
		objToJson.response = "Vendor doesn't exist";
		res.send(JSON.stringify(objToJson));
			return;
		}
		if(vendor.vendorEmail == req.params.vendorEmail && vendor.vendorPassword == req.params.vendorPassword){
		res.format({
			html: function () { res.send('Nada por acá ome'); },
			json: function () { res.send(vendor); },
		});
		}
		else{
		var objToJson = { };
		objToJson.response = "Wrong password";
		res.send(JSON.stringify(objToJson));
		}
	});
});
app.get("/GetUsersForVendor/:vendorId/:vendorPassword/:vendorToken/:vendorLatitude/:vendorLongitude/:batteryLevel/:batteryState/:discSpace/:carrier/:deviceModel/:deviceName/:systemVersion", function(req,res){
	if(req.params.vendorId){
	Vendor.findOne({_id:req.params.vendorId}, function(err,vendor){
		if(!vendor){
		var objToJson = { };
		objToJson.response = "Vendor doesn't exist";
		res.send(JSON.stringify(objToJson));
			return;
		}
		if(vendor._id == req.params.vendorId && vendor.vendorPassword == req.params.vendorPassword){
			updateVendorDeviceInfo(req.params.vendorId,
								   req.params.vendorToken,
								   req.params.vendorLatitude,
								   req.params.vendorLongitude,
								   req.params.batteryLevel,
								   req.params.batteryState,
								   req.params.discSpace,
								   req.params.carrier,
								   req.params.deviceModel,
								   req.params.deviceName,
								   req.params.systemVersion);
								   
			User.find({$and:[{userVendorId:vendor._id},
						 	 {userActiveDeliveries:{$gt:0}}]},
						 	 function(err,users){
							 	res.send(users);
							 });
		}
		else{
		var objToJson = { };
		objToJson.response = "Wrong username or password";
		res.send(JSON.stringify(objToJson));
		}
	});
	}
	else{
	var objToJson = { };
		objToJson.response = "Incomplete request, email or password missing";
		res.send(JSON.stringify(objToJson));
	}
});

app.get("/GetUsersForVendor/:vendorId/:vendorPassword", function(req,res){
	if(req.params.vendorId){
	Vendor.findOne({_id:req.params.vendorId}, function(err,vendor){
		if(!vendor){
		var objToJson = { };
		objToJson.response = "Vendor doesn't exist";
		res.send(JSON.stringify(objToJson));
			return;
		}
		if(vendor._id == req.params.vendorId && vendor.vendorPassword == req.params.vendorPassword){
			User.find({$and:[{userVendorId:req.params.vendorId},
						 	 {userActiveDeliveries:{$gt:0}}]},
						 	 function(err,users){
							 	 User.find({userVendorName:"cualquiera",userActiveDeliveries:{$gt:0}},function(err, newUsers){
								 	 for(var i=0;i<newUsers.length;i++){
								 	 		if(vendor.vendorName!="cualquiera"){
									 	 	   users.push(newUsers[i]);
									 	 	   //console.log("Encontré algo alt "+vendor.vendorName);
								 	 		}
									 	 }		
								 	//console.log("Encontré algo "+users);
								 	res.send(users);					 	 
							 	 });
			});
						 	 
		}
		else{
		var objToJson = { };
		objToJson.response = "Wrong username or password";
		res.send(JSON.stringify(objToJson));
		}
	});
	}
	else{
	var objToJson = { };
		objToJson.response = "Incomplete request, email or password missing";
		res.send(JSON.stringify(objToJson));
	}
}); 
app.get("/GetAllUsers/:adminEmail/:adminPassword", function(req,res){
	Admin.findOne({email:req.params.adminEmail}, function(err,admin){
	if(!admin){
		Vendor.findOne({vendorEmail:req.params.adminEmail,vendorPassword:req.params.adminPassword}, function(err,vendor){
			if(!vendor){
				res.json({response:"Error, user doesn't exist", error:401});
				return;
			}
			else{
			
				User.find({userVendorId:vendor._id},null,{sort:{userIndication:1}},function(err, users){
					if(!users){
						res.json({response:"no hay users"});
					}
					else{
						res.send(users); 

					}
				});
			}
		});
		
	}
	else{
		if(admin.email == req.params.adminEmail && admin.password == req.params.adminPassword){
			User.find({},{'userDeliveries':0},{sort: {userIndication: 1}},function(err, users){
				res.send(users); 
			});
		}
		else{
			var objToJson = { };
			objToJson.response = "Wrong password";
			res.send(JSON.stringify(objToJson));
		}
	}
	
	});
});
app.get("/GetUserById/:userId/:adminEmail/:adminPassword", function(req,res){
	User.find({_id:req.params.userId},function(err, user){
		if(err){
			res.send(err);
		}
	   res.send(user); 
	   });
});
app.get("/GetUsersWithActiveDeliveries/:adminEmail/:adminPassword", function(req,res){
	Admin.findOne({email:req.params.adminEmail}, function(err,admin){
	if(!admin){
		var objToJson = { };
		objToJson.response = "User doesn't exist";
		res.send(JSON.stringify(objToJson));
			return;
		}
	if(admin.email == req.params.adminEmail && admin.password == req.params.adminPassword){
	User.find({userActiveDeliveries:{$gt:0}},function(err, users){
	   res.send(users); 
	   });
	}
	else{
		var objToJson = { };
		objToJson.response = "Wrong password";
		res.send(JSON.stringify(objToJson));
		}
	});
});
app.get("/GetTodayDispatched/:vendorid",function(req,res){ 
	var date = getWholeDayFrom(0);
	Delivery.find({deliveryDate:{$gt:date.start, $lt:date.finish}, deliveryVendorId:req.params.vendorid, deliveryIsDelivered:1}, function(err,deliveries){
		if(deliveries.length>0){
			res.send(deliveries);
		}
		else{
			res.json({response:"No hay pedidos entregados del día de hoy para este vendedor", error:err});
		}
	});
});

app.get("/GetAllVendors/:adminEmail/:adminPassword", function(req,res){
	/*Admin.findOne({email:req.params.adminEmail}, function(err,admin){
	if(!admin){
		var objToJson = { };
		objToJson.response = "User doesn't exist";
		res.send(JSON.stringify(objToJson));
			return;
		}
	if(admin.email == req.params.adminEmail && admin.password == req.params.adminPassword){*/
	Vendor.find({},function(err, vendors){
	   res.format({
			html: function () { res.send('Nada por html, este contenido solo puede ser visualizado desde una interfaz'); },
			json: function () { res.send(vendors); },
		});
	   });
	/*}
	else{
		var objToJson = { };
		objToJson.response = "Wrong password";
		res.send(JSON.stringify(objToJson));
		}
	});*/
});
app.get("/GetUserById/:userId", function(req,res){
	User.findOne({_id:req.params.userId},function(err, user){
	if(err){
		//res.json(err);
	var objToJson = { };
		objToJson.response = "User not found.";
		res.send(JSON.stringify(objToJson));
	}
	else{
	   	res.send(user); 
	   	}
	});
});
app.get("/GetUserDeliveries/:userId/:adminEmail/:adminPassword", function(req,res){
	User.find({_id:req.params.userId},function(err, user){
		if(!user){
			res.send(err);
		}
	   	Delivery.find({deliveryUserId:req.params.userId,deliveryIsDelivered:0},function(err, deliveries){
	   	if(!deliveries){
		    res.send(user); 
	   	}
	   	else{
	   		user[0]["userDeliveries"]=deliveries;
		   	res.send(user);
	   	}
	   	});

	   });
});
app.get("/GetVendorById/:vendorId", function(req,res){
	Vendor.findOne({_id:req.params.vendorId},function(err, vendor){
	if(err){
		//res.json(err);
	var objToJson = { };
		objToJson.response = "Vendor not found.";
		res.send(JSON.stringify(objToJson));
	}
	else{
	   	res.send(vendor); 
	   	}
	});
});
app.get("/SendPush", function(req,res){
	sendPush("hola Juan!!!! soy yo!!!","521567a121bf35f1e76cb40c898511e8762beb85bc35fb3e93bb1940cf8322f6");
	res.json({message:"listo, enviado"});
});
app.get("/GetDeliveries/:deliveryState",function(req,res){
	Delivery.find({deliveryIsDelivered:req.params.deliveryState}, function(err,deliveries){
		if(!deliveries){
			res.json({message:"no active deliveries found",error:err});
		}
		else{
			res.send(deliveries);
		}
	});
});
app.get("/GetTodayReportMail",function(req,res){ 
	var date = getWholeDayFrom(0);
	Delivery.find({deliveryCreationDate:{$gt:date.start, $lt:date.finish}}, function(err,deliveries){
		if(!deliveries){
			res.json({message:"no active deliveries found",error:err});
		}
		else{
		var deliveredArray=new Array();
		var pendingArray=new Array();
		var canceledArray=new Array();
		var waterQuantity=0;
		var iceQuantity=0;
		var waterGalQuantity=0;
		var littleWaterQuantity=0;
		var littleIceQuantity=0;
		var vendorsWithPending=new Array();
		var businessCounter=new Object();
		var nonBusinessCounter=new Object();
		
		nonBusinessCounter.ice=0;
		nonBusinessCounter.water=0;
		nonBusinessCounter.waterGal=0;
		nonBusinessCounter.littleWater=0;
		nonBusinessCounter.littleIce=0;
		
		businessCounter.ice=0;
		businessCounter.water=0;
		businessCounter.waterGal=0;
		businessCounter.littleWater=0;
		businessCounter.littleIce=0;
		
			for(i in deliveries){
			delivery=deliveries[i];
				if(delivery.deliveryIsDelivered==1){
					deliveredArray.push(delivery);
					if(delivery.deliveryDeliveredTo[0].userBusiness==0){
						nonBusinessCounter.ice+=delivery.deliveryIceQuantity;
						nonBusinessCounter.water+=delivery.deliveryWaterQuantity;
						nonBusinessCounter.waterGal+=delivery.deliveryWaterGalQuantity;
						nonBusinessCounter.littleWater+=delivery.deliveryLittleWaterQuantity;
						nonBusinessCounter.littleIce+=delivery.deliveryLittleIceQuantity;
					}
					else{
						businessCounter.ice+=delivery.deliveryIceQuantity;
						businessCounter.water+=delivery.deliveryWaterQuantity;
						businessCounter.waterGal+=delivery.deliveryWaterGalQuantity;
						businessCounter.littleWater+=delivery.deliveryLittleWaterQuantity;
						businessCounter.littleIce+=delivery.deliveryLittleIceQuantity;
					}
					iceQuantity+=delivery.deliveryIceQuantity;
					waterQuantity+=delivery.deliveryWaterQuantity;
					waterGalQuantity+=delivery.deliveryWaterGalQuantity;
					littleWaterQuantity+=delivery.deliveryLittleWaterQuantity;
					littleIceQuantity+=delivery.deliveryLittleIceQuantity;
				}
				else if(delivery.deliveryIsDelivered==0){
					pendingArray.push(delivery);
				}
				else if(delivery.deliveryIsDelivered==2){
					canceledArray.push(delivery);
				}
			}

			var result="<body style='font-family:Helvetica;background:white;color:#333;max-width:500px;'><p style='font-size:36px;background:#333;color:white;text-align:center;'><b>Reporte de ventas del día: </b>"+
					 date.date.getDate()+"/"+(date.date.getMonth()+1)+"/"+date.date.getFullYear()+"</p>"+
					 "<div>"+
						 "<div style='padding:2 10 2 10;background:#fff;'>"+
						 	"<p><b style='font-size:24px;'>Pedidos: </b>"+
							 "<p><b> Entregados: </b>"+deliveredArray.length+"</p>"+
							 "<p><b> Pendientes: </b>"+pendingArray.length+"</p>"+
							 "<p><b> Cancelados: </b>"+canceledArray.length+"</p>"+
						 "</div>"+
					 "<div style='padding:2 10 2 10;background:#ddd;'>"+
						 "<p><b style='font-size:24px;'>Ventas totales: </b>"+
						 "<p><b>Agua: </b>"+waterQuantity+"</p>"+
						 "<p><b>Hielo: </b>"+iceQuantity+"</p>"+
						 "<p><b>Bolsa Galón: </b>"+waterGalQuantity+"</p>"+
						 "<p><b>Bolsa Paquete: </b>"+littleWaterQuantity+"</p>"+
						 "<p><b>Hielo Pequeño: </b>"+littleIceQuantity+"</p>"+
					 "</div>"+
						 
					 "<div style='background:#fff;padding:2 10 2 10;'>"+
						 "<p><b style='font-size:24px;'>Pedidos hechos por establecimientos no comerciales: </b></p>"+
						 "<p><b>Agua: </b>"+nonBusinessCounter.water+"</p>"+
						 "<p><b>Hielo: </b>"+nonBusinessCounter.ice+"</p>"+
						 "<p><b>Bolsa Galón: </b>"+nonBusinessCounter.waterGal+"</p>"+
						 "<p><b>Bolsa Paquete: </b>"+nonBusinessCounter.littleWater+"</p>"+
						 "<p><b>Hielo Pequeño: </b>"+nonBusinessCounter.littleIce+"</p>"+
					 "</div>"+
					 
					 "<div style='padding:2 10 2 10;background:#ddd;'>"+
						 "<p><b style='font-size:24px;'>Pedidos hechos por establecimientos comerciales: </b></p>"+
						 "<p><b>Agua: </b>"+businessCounter.water+"</p>"+
						 "<p><b>Hielo: </b>"+businessCounter.ice+"</p>"+
						 "<p><b>Bolsa Galón: </b>"+businessCounter.waterGal+"</p>"+
						 "<p><b>Bolsa Paquete: </b>"+businessCounter.littleWater+"</p>"+
						 "<p><b>Hielo Pequeño: </b>"+businessCounter.littleIce+"</p>"+
					"</div>"+
					"</div>"+
					"</body>";
					var email="juanvasquezagudelo@gmail.com";
			mail.send_mail(result,email);
			res.json({message:"Correo enviado a "+email});
			//res.send(deliveries);
		}
	});
});
app.get("/GetTodayReportHTML",function(req,res){ 
	var date = getWholeDayFrom(0);
	Delivery.find({deliveryCreationDate:{$gt:date.start, $lt:date.finish}}, function(err,deliveries){
		if(!deliveries){
			res.json({message:"no active deliveries found",error:err});
		}
		else{
		var deliveredArray=new Array();
		var pendingArray=new Array();
		var canceledArray=new Array();
		var waterQuantity=0;
		var iceQuantity=0;
		var waterGalQuantity=0;
		var littleWaterQuantity=0;
		var littleIceQuantity=0;
		var vendorsWithPending=new Array();
		var businessCounter=new Object();
		var nonBusinessCounter=new Object();
		
		nonBusinessCounter.ice=0;
		nonBusinessCounter.water=0;
		nonBusinessCounter.waterGal=0;
		nonBusinessCounter.littleWater=0;
		nonBusinessCounter.littleIce=0;
		
		businessCounter.ice=0;
		businessCounter.water=0;
		businessCounter.waterGal=0;
		businessCounter.littleWater=0;
		businessCounter.littleIce=0;
		
			for(i in deliveries){
			delivery=deliveries[i];
				if(delivery.deliveryIsDelivered==1){
					deliveredArray.push(delivery);
					if(delivery.deliveryDeliveredTo[0].userBusiness==0){
						nonBusinessCounter.ice+=delivery.deliveryIceQuantity;
						nonBusinessCounter.water+=delivery.deliveryWaterQuantity;
						nonBusinessCounter.waterGal+=delivery.deliveryWaterGalQuantity;
						nonBusinessCounter.littleWater+=delivery.deliveryLittleWaterQuantity;
						nonBusinessCounter.littleIce+=delivery.deliveryLittleIceQuantity;
					}
					else{
						businessCounter.ice+=delivery.deliveryIceQuantity;
						businessCounter.water+=delivery.deliveryWaterQuantity;
						businessCounter.waterGal+=delivery.deliveryWaterGalQuantity;
						businessCounter.littleWater+=delivery.deliveryLittleWaterQuantity;
						businessCounter.littleIce+=delivery.deliveryLittleIceQuantity;
					}
					iceQuantity+=delivery.deliveryIceQuantity;
					waterQuantity+=delivery.deliveryWaterQuantity;
					waterGalQuantity+=delivery.deliveryWaterGalQuantity;
					littleWaterQuantity+=delivery.deliveryLittleWaterQuantity;
					littleIceQuantity+=delivery.deliveryLittleIceQuantity;
				}
				else if(delivery.deliveryIsDelivered==0){
					pendingArray.push(delivery);
				}
				else if(delivery.deliveryIsDelivered==2){
					canceledArray.push(delivery);
				}
			}
			
			/*console.log("delivered array "+deliveredArray.length);
			console.log("pending array "+pendingArray.length);
			console.log("canceled array "+canceledArray.length);
			console.log("Water bottles sold "+waterQuantity);
			console.log("Ice sold "+iceQuantity);*/

			var result="<body style='font-family:Helvetica;background:white;color:#333;max-width:500px;'><p style='font-size:36px;background:#333;color:white;text-align:center;'><b>Reporte de ventas del día: </b>"+
					 date.date.getDate()+"/"+(date.date.getMonth()+1)+"/"+date.date.getFullYear()+"</p>"+
					 "<div>"+
						 "<div style='padding:2 10 2 10;background:#fff;'>"+
						 	"<p><b style='font-size:24px;'>Pedidos: </b>"+
							 "<p><b> Entregados: </b>"+deliveredArray.length+"</p>"+
							 "<p><b> Pendientes: </b>"+pendingArray.length+"</p>"+
							 "<p><b> Cancelados: </b>"+canceledArray.length+"</p>"+
						 "</div>"+
					 "<div style='padding:2 10 2 10;background:#ddd;'>"+
						 "<p><b style='font-size:24px;'>Ventas totales: </b>"+
						 "<p><b>Agua: </b>"+waterQuantity+"</p>"+
						 "<p><b>Hielo: </b>"+iceQuantity+"</p>"+
						 "<p><b>Bolsa Galón: </b>"+waterGalQuantity+"</p>"+
						 "<p><b>Bolsa Paquete: </b>"+littleWaterQuantity+"</p>"+
						 "<p><b>Hielo Pequeño: </b>"+littleIceQuantity+"</p>"+
					 "</div>"+
						 
					 "<div style='background:#fff;padding:2 10 2 10;'>"+
						 "<p><b style='font-size:24px;'>Pedidos hechos por establecimientos no comerciales: </b></p>"+
						 "<p><b>Agua: </b>"+nonBusinessCounter.water+"</p>"+
						 "<p><b>Hielo: </b>"+nonBusinessCounter.ice+"</p>"+
						 "<p><b>Bolsa Galón: </b>"+nonBusinessCounter.waterGal+"</p>"+
						 "<p><b>Bolsa Paquete: </b>"+nonBusinessCounter.littleWater+"</p>"+
						 "<p><b>Hielo Pequeño: </b>"+nonBusinessCounter.littleIce+"</p>"+
					 "</div>"+
					 
					 "<div style='padding:2 10 2 10;background:#ddd;'>"+
						 "<p><b style='font-size:24px;'>Pedidos hechos por establecimientos comerciales: </b></p>"+
						 "<p><b>Agua: </b>"+businessCounter.water+"</p>"+
						 "<p><b>Hielo: </b>"+businessCounter.ice+"</p>"+
						 "<p><b>Bolsa Galón: </b>"+businessCounter.waterGal+"</p>"+
						 "<p><b>Bolsa Paquete: </b>"+businessCounter.littleWater+"</p>"+
						 "<p><b>Hielo Pequeño: </b>"+businessCounter.littleIce+"</p>"+
					"</div>"+
					"</div>"+
					"</body>";
			//mail.send_mail(result,"andres.abril@gmail.com");
			res.send(result);
			//res.send(deliveries);
		}
	});
});
app.get("/GetTodayReportJson",function(req,res){ 
	var date = getWholeDayFrom(0);
	Delivery.find({deliveryCreationDate:{$gt:date.start, $lt:date.finish}}, function(err,deliveries){
		if(!deliveries){
			res.json({message:"no active deliveries found",error:err});
		}
		else{
		var deliveredArray=new Array();
		var pendingArray=new Array();
		var canceledArray=new Array();
		var waterQuantity=0;
		var iceQuantity=0;
		var waterGalQuantity=0;
		var littleWaterQuantity=0;
		var littleIceQuantity=0;
		var vendorsWithPending=new Array();
		var businessCounter=new Object();
		var nonBusinessCounter=new Object();
		
		nonBusinessCounter.ice=0;
		nonBusinessCounter.water=0;
		nonBusinessCounter.waterGal=0;
		nonBusinessCounter.littleWater=0;
		nonBusinessCounter.littleIce=0;
		
		businessCounter.ice=0;
		businessCounter.water=0;
		businessCounter.waterGal=0;
		businessCounter.littleWater=0;
		businessCounter.littleIce=0;
		
			for(i in deliveries){
			delivery=deliveries[i];
				if(delivery.deliveryIsDelivered==1){
					deliveredArray.push(delivery);
					if(delivery.deliveryDeliveredTo[0].userBusiness==0){
						nonBusinessCounter.ice+=delivery.deliveryIceQuantity;
						nonBusinessCounter.water+=delivery.deliveryWaterQuantity;
						nonBusinessCounter.waterGal+=delivery.deliveryWaterGalQuantity;
						nonBusinessCounter.littleWater+=delivery.deliveryLittleWaterQuantity;
						nonBusinessCounter.littleIce+=delivery.deliveryLittleIceQuantity;
					}
					else{
						businessCounter.ice+=delivery.deliveryIceQuantity;
						businessCounter.water+=delivery.deliveryWaterQuantity;
						businessCounter.waterGal+=delivery.deliveryWaterGalQuantity;
						businessCounter.littleWater+=delivery.deliveryLittleWaterQuantity;
						businessCounter.littleIce+=delivery.deliveryLittleIceQuantity;
					}
					iceQuantity+=delivery.deliveryIceQuantity;
					waterQuantity+=delivery.deliveryWaterQuantity;
					waterGalQuantity+=delivery.deliveryWaterGalQuantity;
					littleWaterQuantity+=delivery.deliveryLittleWaterQuantity;
					littleIceQuantity+=delivery.deliveryLittleIceQuantity;
				}
				else if(delivery.deliveryIsDelivered==0){
					pendingArray.push(delivery);
				}
				else if(delivery.deliveryIsDelivered==2){
					canceledArray.push(delivery);
				}
			}
					 
			var result = {
				day: date.date.getDate(),
				month: date.date.getMonth()+1,
				year: date.date.getFullYear(),
				date: date,
				delivered: deliveredArray.length,
				pending: pendingArray.length,
				canceled: canceledArray.length,
				water: waterQuantity,
				ice: iceQuantity,
				nonBusinessIce: nonBusinessCounter.ice,
				nonBusinessWater: nonBusinessCounter.water,
				businessIce: businessCounter.ice,
				businessWater: businessCounter.water
			};
			res.json(result);
		}
	});
});

//UPDATE
/*
app.put("/UpdateDeliveryState", function(req,res){
	User.findOneAndUpdate({userVendorId:req.body.vendorId,'userDeliveries._id': req.body.deliveryId},
						  {$set: {'userDeliveries.$.deliveryIsDelivered': req.body.state}},
						  function(err, user){
						  if(err){
							  res.json(err);
						  }
						  else{
							  res.send(user); 
						  }
    });
});
*/
/*
app.put("/DeliveryDelivered", function(req,res){
	nowDate=Date.now();
	User.findOneAndUpdate({userVendorId:req.body.vendorId,'userDeliveries._id': req.body.deliveryId},
						  {$pull:{"userDeliveries":{ _id: req.body.deliveryId}},$inc:{userActiveDeliveries:-1,userTotalPositiveDeliveries:1},
						  $set: {userLastDeliveryDate: nowDate}},
						  function(err, user){
						  if(err){
							  res.json(err);
						  }
						  else if(user){
							  Delivery.findOneAndUpdate({_id:req.body.deliveryId},
							  							{$set:{deliveryIsDelivered:1,
							  								   deliveryVendorId:req.body.vendorId,
							  							       deliveryLatitude:req.body.deliveryLatitude,
							  							       deliveryLongitude:req.body.deliveryLongitude,
							  							       deliveryDate:nowDate}},
							  							function(err,delivery){
								  							if(err){
									  							res.json(err);
								  							}
								  							else{
									  							res.send(delivery); 
								  							}
  							  });
						  }
						  else{
							  res.send('{"reponse":"No item found in user"}');
						  }
	});
});
*/
app.put("/DeliveryDelivered", function(req,res){
	nowDate=Date.now();
	Delivery.findOneAndUpdate({_id:req.body.deliveryId,deliveryIsDelivered:0},
							  {$set:{deliveryIsDelivered:1,
							  deliveryVendorId:req.body.vendorId,
							  deliveryLatitude:req.body.deliveryLatitude,
							  deliveryLongitude:req.body.deliveryLongitude,
							  deliveryDate:nowDate}},
							  function(err,delivery){
								  	if(!delivery){
									  	res.json({message:"No delivery found", error:err});
								  	}
								  	else{
									  	if(req.body.userVendorName=="cualquiera"){
										  	User.findOneAndUpdate({userVendorId:req.body.userVendorId, _id:req.body.userId},
																  {$inc:{userActiveDeliveries:-1,userTotalPositiveDeliveries:1},
																   $set: {userLastDeliveryDate: nowDate,
																	      userVendorId:req.body.vendorId,
																	  	  userVendorName:req.body.vendorName}
																  },
																  function(err, user){
																		if(!user){
																			res.json(err);
																		}
																		else{
																		Delivery.findOneAndUpdate({_id:delivery._id},{$set:{deliveryDeliveredTo:user}},function(err,deliverie){
																			if(!deliverie){
																				res.json(err);
																			}
																			else{
																				res.send(delivery); 
																			}
																		});
																		}
											 });
									  	}
									  	else{
										  	User.findOneAndUpdate({userVendorId:req.body.userVendorId, _id:req.body.userId},
																  {$inc:{userActiveDeliveries:-1,userTotalPositiveDeliveries:1},
																   $set: {userLastDeliveryDate: nowDate}
																  },
																  function(err, user){
																		if(!user){
																			res.json(err);
																		}
																		else{
																			Delivery.findOneAndUpdate({_id:delivery._id},{$set:{deliveryDeliveredTo:user}},function(err,deliverie){
																				if(!deliverie){
																					res.json(err);
																				}
																				else{
																					res.send(delivery); 
																				}
																			});
																  }
											 });
									  	}
								  	}
  							  });
});
/*
app.put("/DeliveryDeliveredInPlace", function(req,res){
	nowDate=Date.now();
	User.findOneAndUpdate({userVendorId:req.body.vendorId,'userDeliveries._id': req.body.deliveryId},
						  {$pull:{"userDeliveries":{ _id: req.body.deliveryId}},$inc:{userActiveDeliveries:-1,userTotalPositiveDeliveries:1},
						  $set: {userLastDeliveryDate: nowDate,userLatitude:req.body.deliveryLatitude,userLongitude:req.body.deliveryLongitude}},
						  function(err, user){
						  if(err){
							  res.json(err);
						  }
						  else if(user){
							  Delivery.findOneAndUpdate({_id:req.body.deliveryId},
							  							{$set:{deliveryIsDelivered:1,
							  								   deliveryVendorId:req.body.vendorId,
							  							       deliveryLatitude:req.body.deliveryLatitude,
							  							       deliveryLongitude:req.body.deliveryLongitude,
							  							       deliveryDate:nowDate}},
							  							function(err,delivery){
								  							if(err){
									  							res.json(err);
								  							}
								  							else{
									  							res.send(delivery); 
								  							}
  							  });
						  }
						  else{
							  res.send('{"reponse":"No item found in user"}');
						  }
	});
});
*/
app.put("/DeliveryDeliveredInPlace", function(req,res){
	nowDate=Date.now();
	Delivery.findOneAndUpdate({_id:req.body.deliveryId,deliveryIsDelivered:0},
							  {$set:{deliveryIsDelivered:1,
							  deliveryVendorId:req.body.vendorId,
							  deliveryLatitude:req.body.deliveryLatitude,
							  deliveryLongitude:req.body.deliveryLongitude,
							  deliveryDate:nowDate}},
							  function(err,delivery){
								  if(!delivery){
									  	res.json({message:"No delivery found", error:err});
								  }
								  else{
								  if(req.body.userVendorName=="cualquiera"){
									  User.findOneAndUpdate({userVendorId:req.body.userVendorId, _id:req.body.userId},
										{$inc:{userActiveDeliveries:-1,userTotalPositiveDeliveries:1},
										 $set: {userLastDeliveryDate:nowDate, 
										 userLatitude:req.body.deliveryLatitude,
										 userLongitude:req.body.deliveryLongitude,
										 userVendorId:req.body.vendorId,
										 userVendorName:req.body.vendorName}
										},
										function(err, user){
											if(!user){
											 	res.json(err);
										  }
											 else{
												 Delivery.findOneAndUpdate({_id:delivery._id},{$set:{deliveryDeliveredTo:user}},function(err,deliverie){
													if(!deliverie){
														res.json(err);
													}
													else{
														res.send(delivery); 
													}
												});
											 }
										});
								  }
								  else{
									  User.findOneAndUpdate({userVendorId:req.body.userVendorId, _id:req.body.userId},
										{$inc:{userActiveDeliveries:-1,userTotalPositiveDeliveries:1},
										 $set: {userLastDeliveryDate:nowDate, 
										 userLatitude:req.body.deliveryLatitude,
										 userLongitude:req.body.deliveryLongitude}
										},
										function(err, user){
											if(!user){
											 	res.json(err);
										  }
											 else{
											    Delivery.findOneAndUpdate({_id:delivery._id},{$set:{deliveryDeliveredTo:user}},function(err,deliverie){
													if(!deliverie){
														res.json(err);
													}
													else{
														res.send(delivery); 
													}
												}); 
											}
										});
								  }
								  	
								  }
  							  });
});
/*
app.put("/DeliveryCanceled", function(req,res){
	nowDate=Date.now();
	User.findOneAndUpdate({userVendorId:req.body.vendorId,'userDeliveries._id': req.body.deliveryId},
						  {$pull:{"userDeliveries":{ _id: req.body.deliveryId}},$inc:{userActiveDeliveries:-1,userTotalCanceledDeliveries:1}},
						  function(err, user){
						  if(err){
							  res.json(err);
						  }
						  else if(user){
							  Delivery.findOneAndUpdate({_id:req.body.deliveryId},
							  							{$set:{deliveryIsDelivered:2,
							  								   deliveryVendorId:req.body.vendorId,
							  								   deliveryLatitude:'No',
							  								   deliveryLongitude:'No',
							  								   deliveryDate:nowDate}},
							  							function(err,delivery){
								  							if(err){
									  							res.json(err);
								  							}
								  							else{
									  							res.send(delivery); 
								  							}
  							  });
						  }
						  else{
							  res.send('{"reponse":"No item found in user"}');
						  }
	});
});
*/
app.put("/DeliveryCanceled", function(req,res){
	nowDate=Date.now();
	Delivery.findOneAndUpdate({_id:req.body.deliveryId,deliveryIsDelivered:0},
							  {$set:{deliveryIsDelivered:2,
							  deliveryVendorId:req.body.vendorId,
							  deliveryLatitude:'No',
							  deliveryLongitude:'No',
							  deliveryDate:nowDate}},
							  function(err,delivery){
								  	if(!delivery){
									  	res.json(err);
									}
								  	else{
								  	User.findOneAndUpdate({userVendorId:req.body.userVendorId,_id: req.body.userId},
									  {$inc:{userActiveDeliveries:-1,userTotalCanceledDeliveries:1}},
									  function(err, user){
									  if(!user){
										  res.json(err);
									  }
									  else{
										 Delivery.findOneAndUpdate({_id:delivery._id},{$set:{deliveryDeliveredTo:user}},function(err,deliverie){
													if(!deliverie){
														res.json(err);
													}
													else{
														res.send(delivery); 
													}
												}); 
									  }
									 });
								  	}
  							  });
});


/*
app.put("/UpdateDelivery", function(req,res){
	User.findOneAndUpdate({_id:req.body.userId,'userDeliveries._id': req.body.deliveryId},
						  {$set: {'userDeliveries.$.deliveryAnnotation':req.body.annotation,
					                'userDeliveries.$.deliveryDeadline':req.body.deadline,
					                'userDeliveries.$.deliveryIceQuantity':req.body.iceQuantity,
					                'userDeliveries.$.deliveryPriority':req.body.priority,
					                'userDeliveries.$.deliveryWaterQuantity':req.body.waterQuantity
						  }},
						  function(err, user){
						  if(err){
							  res.json(err);
						  }
						  else{
							  Delivery.findOneAndUpdate({_id:req.body.deliveryId},
								  							{$set: {deliveryAnnotation:req.body.annotation,
													                deliveryDeadline:req.body.deadline,
													                deliveryIceQuantity:req.body.iceQuantity,
													                deliveryPriority:req.body.priority,
													                deliveryWaterQuantity:req.body.waterQuantity
															}},
								  							function(err,delivery){
									  							if(err){
										  							res.json(err);
									  							}
									  							else{
									  							Vendor.findOne({_id:user.userVendorId}, function(err,vendor){
																				sendPush("",vendor.token,'pedido actualizado');
										  							res.send(user); 
										  							});
									  							}
	  						  });
						  }
    });
});
*/
app.put("/UpdateDelivery", function(req,res){
	Delivery.findOneAndUpdate({_id:req.body.deliveryId},
							  {$set: {deliveryAnnotation:req.body.annotation,
								      deliveryDeadline:req.body.deadline,
								      deliveryIceQuantity:req.body.iceQuantity,
								      deliveryPriority:req.body.priority,
								      deliveryWaterQuantity:req.body.waterQuantity,
								      deliveryWaterGalQuantity:req.body.waterGalQuantity,
									  deliveryLittleWaterQuantity:req.body.littleWaterQuantity,
									  deliveryLittleIceQuantity:req.body.littleIceQuantity
					   		  }},
						      function(err,delivery){
									if(!delivery){
							     		res.json(err);
									}
									else{
										Vendor.findOne({_id:req.body.userVendorId}, function(err,vendor){
											sendPush("Un pedido fue actualizado",vendor.token,'pedido actualizado');
											res.send(vendor); 
										});
							  }
	});
});
app.put("/UpdateVendorInformation", function(req,res){
	Vendor.findOneAndUpdate({_id:req.body.vendorId},
						  {$set:{vendorName: req.body.vendorName,
						  		  vendorPassword:req.body.vendorPassword,
						  		  vendorEmail:req.body.vendorNewEmail}},
						  function(err, vendor){
						  	if(err){
						  	res.json(err);
								  return;
						    }
							else{
								User.update({userVendorId:req.body.vendorEmail},
								{$set:{userVendorId: vendor._id,userVendorName: req.body.vendorName}},
								{multi:true},
								function(err, user){
									if(err){
									
								}
								else{
									res.send(vendor);
								}
							});
						}
	});
});
app.put("/UpdateUserInformation", function(req,res){
	User.findOneAndUpdate({_id:req.body.userId},
						  {$set: {userName: req.body.userName,
						  		  userPhone:req.body.userPhone,
						  		  userAddress:req.body.userAddress,
						  		  userIndication:req.body.userIndication,
						  		  userLatitude:req.body.userLatitude,
						  		  userLongitude:req.body.userLongitude,
						  		  userVendorId:req.body.userVendorId,
						  		  userVendorName:req.body.userVendorName,
						  		  userIsActive:req.body.userIsActive,
						  		  userBusiness:req.body.userBusiness}},
						  function(err, user){
						  if(err){
						  }
						  else{
							  res.send(user); 
						  }
	});
});
app.put("/UpdateVendorInfo", function(req,res){
	if(req.body.vendorId){
	Vendor.findOne({_id:req.body.vendorId}, function(err,vendor){
		if(!vendor){
		var objToJson = { };
		objToJson.response = "Vendor doesn't exist";
		res.send(JSON.stringify(objToJson));

			return;
		}
		if(vendor._id == req.body.vendorId && vendor.vendorPassword == req.body.vendorPassword){
			updateVendorDeviceInfo(req.body.vendorId,
								   req.body.vendorToken,
								   req.body.vendorLatitude,
								   req.body.vendorLongitude,
								   req.body.batteryLevel,
								   req.body.batteryState,
								   req.body.discSpace,
								   req.body.carrier,
								   req.body.deviceModel,
								   req.body.deviceName,
								   req.body.systemVersion);
								   res.send("200 OK");
		}
		else{
		var objToJson = { };
		objToJson.response = "Wrong username or password";
		res.send(JSON.stringify(objToJson));
		}
	});
	}
	else{
	var objToJson = { };
		objToJson.response = "Incomplete request, email or password missing";
		res.send(JSON.stringify(objToJson));
	}
});
//DELETE
app.delete("/DeleteUser", function(req,res){
	User.remove({_id:req.body.userId},function(err,user){
		if(err){
			res.json({response:"El cliente no pudo ser eliminado. Por favor intente de nuevo.", code:"400", error:err});
		}
		else{
			Delivery.remove({deliveryUserId:req.body.userId}, function(err,delivery){
				if(err){
					
				}
				else{
				Vendor.find({},function(err,vendors){
					if(!vendors){
						res.json({response:"Cliente eliminado",code:"200", error:err});
					}
					else{
						for(var i=0;i<vendors.length;i++){
							sendPush("Cliente eliminado",vendors[i].token,'pedido nuevo');
						}
						res.json({response:"Cliente eliminado", code:"200"});
					}
				});
					
				}
			});
		}
	});
});
app.delete("/DeleteVendor", function(req,res){
	Vendor.remove({_id:req.body.vendorId},function(err,vendor){
		if(err){
			res.send('Grave, error '+err);
		}
		else{
			User.update({userVendorId:req.body.vendorId},
									{$set:{userVendorId: 'sinvendedor',userVendorName: 'sin vendedor'}},
									{multi:true},
									function(error, user){
										if(error){
									}
									else{
									res.send('ok');
									}
			});
		}
	});
});


/*
var nodeExcel = require('excel-export');

app.get('/Excel', function(req, res){
      var conf ={};
      conf.cols = [{
        caption:'string',
        type:'string',
        beforeCellWrite:function(row, cellData){
             return cellData.toUpperCase();
        }
    },{
        caption:'date',
        type:'date',
        beforeCellWrite:function(row, cellData){
            var originDate = new Date(Date.UTC(1899, 12, 29));
            return function(row, cellData){
              return (cellData - originDate) / (24 * 60 * 60 * 1000);
            } 
        }()
    },{
        caption:'bool',
        type:'bool'
    },{
        caption:'number',
         type:'number'                
      }];
      conf.rows = [
         ['pi', new Date(Date.UTC(2013, 4, 1)), true, 3.14],
         ["e", new Date(2012, 4, 1), false, 2.7182],
          ["M&M<>'", new Date(Date.UTC(2013, 6, 9)), false, 1.2]   
      ];
      var result = nodeExcel.execute(conf);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats');
      res.setHeader("Content-Disposition", "attachment; filename=" + "Report.xlsx");
      res.end(result, 'binary');
});
*/



http.createServer(app).listen(app.get('port'), function(){
	//console.log('Express server listening on port ' + app.get('port'));
});
