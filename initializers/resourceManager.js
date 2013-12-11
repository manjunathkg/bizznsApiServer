exports.resourceManager = function(api, next){
	api.resourceManager ={

		//get a list of all resources
		getAllResourceNames : function(callback){

		},

		//get definition of a given resource
		getResource: function(resourceName, callback){ 
		},

		//get definition of a given resource property
		getResourceProperty : function(resourceName, callback){

		},

		//get a resource record given an id
		getResourceByID : function(id,callback){

		},

		//get a resource record given an alias
		getResourceByAlias : function(alias, callback){

		},

		//get a resource record given a url
		getResourceByURL : function(url,callback){

		},

		//find resource records matching a criteria
		getResourceRecordsMatching : function(criteria, fields, callback){

		},

		//update resource record
		updateResourceRecord : function(resourceid,values,callback){

		},

		//createResourceRecord  
		createResourceRecord : function(resourceName,values, callback){

		},

		//destroy a resouce given an id.. doesnt delete referred ids
		deleteResourceRecord : function(resourceName,id, callback){

		}
 
	};

	console.log("****** INSIDE resourceManager *****");
	next();
}
