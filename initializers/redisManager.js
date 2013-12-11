var nohm = require('nohm').Nohm;



exports.redisManager = function(api, next){
	
	api.redis.client.on("error", function (err) {
      console.log("error event - " + client.host + ":" + client.port + " - " + err);
  	});

  	nohm.setClient(api.redis.client);


	api.redisManager = {
		getRedisKey : function(keyType,options,next){
	        var options = options || {};
	        var keyPrefix =   options.prefix || 'bizzns::' ;
	        var keyType  =     keyType ||      'ResourceRecord';
	        var resourceName =     options.resourceName;
	        var resourceAlias =    options.resourceAlias;
	        var resourceId   =     options.id;
	        var relationshipName = options.relationshipName;

	        if(keyType === 'id'){
	          return keyPrefix + resourceId ;
	        }

	        if(keyType === 'ResourceRecord'){
	          return keyPrefix + resourceName + "::" + resourceId ;
	        }

	        if(keyType === 'ResourceRecordByAlias'){
	          return keyPrefix + resourceName + "::" + resourceAlias ;
	        }

	        if(keyType === 'ResourceFields'){
	          return keyPrefix + resourceName + "::fieldset"  ;
	        }

	        if(keyType === 'ResourceRelationship'){
	          return keyPrefix + resourceName + "::" + resourceId + "::" + relationshipName ;
	        }
		}
	}


console.log("******************  In apiController initializer");
	next();
}