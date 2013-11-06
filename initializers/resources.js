var resource = require('resource');
var resources = require('resources');

var jWorkflow = require("jWorkflow");
var workflow = jWorkflow.order();
var sugar = require('sugar');

//
// Use the web admin resource
//

var getRedisKey = function(keyType,options,next){
        var keyPrefix =   options.prefix || 'bizzns::' ;
        var keyType  =     keyType || 'ResourceRecord';
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

 
    

exports.resources = function(api, next){

  // modify / append the api global variable api.
  // I will be run as part of actionHero's boot process

  api.resources = {
 
  	resourcesView: function(next){ 
  	   var error;
  	   var _r;
  	   try{     
        resoursesList = resource.resources;
       }catch(e){
       	error = e;
       }
       var keys = Object.keys(resoursesList).sort();
        api.log("********** Inside Resources View ********");
        next(error, keys);       
    },

    //get definition of one resource
    resource: function(resourceName, next){ 
       var error; 
       api.log("resource here is ============= >>>  " + resourceName);       
       try{     
          _r = resource.resources[resourceName];  
          next(null, _r);           
       }catch(e){
          error = e;
          api.log("** ERROR:: resource :: resources.js ***" + e);
          next(e,null);
       }      
        
             
    },

    //invoke a method on  a resource with params and send results back
    invokeResourceMethod: function(resourceName,methodName,params,next){ 

       api.log("++++++>>>>>>>>  invokeResourceMethod:: methodName1 = " + methodName);
       var error; 
       var resourceMethod;
       var _r;
       var results;
       var methods;
       try{     
          _r = resource.resources[resourceName]; 
          methods = resource.resources[resourceName].methods; 

          api.log("++++++>>>>>>>>  invokeResourceMethod:: methods = " + JSON.stringify(methods));

          resourceMethod = methods[methodName];
          api.log(">>>>>>> " + resourceMethod);
          resourceMethod(params,function(err,results){ 
                      next(error, results);           
          });
       }catch(e){
        error = e;
        api.log("**>>>>>>> ERROR:: resourceMethodView :: resources.js ***" + e);
       }          
    },


    all: function(resourceName,params,next){  
       var error;  
       var _r;  
       try{     
          _r = resource.resources[resourceName];
          _r.all(function(err, data){ 
              next(err,data);
          });               
         }catch(e){
          error = e;
          api.log("**>>>>>>> ERROR:: all :: initializers:resources.js ***" + e);
          next(e,null);
        }          
    },
    

    create: function(resourceName,params,next){  
       var error;  
       var _r;  
       try{     
          _r = resource.resources[resourceName];
          api.log(">> Sending in param - " + JSON.stringify(params)  );
          _r.create(params,function(err, data){ 
               next(err,data);
          });               
         }catch(e){
          error = e;
          api.log("**>>>>>>> ERROR:: create :: initializers:resources.js ***" + e);
          next(e,null);
        }          
    },

    find: function(resourceName,fieldList,queryParams,next){  
       var error;  
       var _r;  
       var FiledArray;
       if(Object.keys(fieldList).length > 0){
          FiledArray = fieldList.split(',');
       }       
           
       var findResoucesMatchinCriteria = function(previous,baton){
          baton.take();
            try{     
                    _r = resource.resources[resourceName];                      
                    resource.invoke(_r.find,queryParams,function(err, data){                          
                        baton.pass(data);                        
                    });               
                   }catch(e){
                      error = e;
                      api.log("ERROR:: find :: initializers:resources.js" + e);
                      baton.pass();
              }  
       };


       var loadResourcesIntoRedis = function(previous, baton){
          baton.take();
            var passedDataRecordsAarray = previous;
            passedDataRecordsAarray.each(function(record){ 

            })
            //try to get resource record for redis.. if doesnt exist load 

          baton.pass(previous);

       };

       var filterForTheNeededFields = function(previous, baton){
          baton.take();


          baton.pass(previous);

       }

       var returnResponse = function(previous, baton){
          next(null,previous);
       }

       //workflow logic
      workflow
      .andThen(findResoucesMatchinCriteria)
      .andThen(loadResourcesIntoRedis)
      .andThen(filterForTheNeededFields)
      .andThen(returnResponse);

      workflow.start();  
    
      api.log("AAAA   END OF  FIND $$$$$$$$$$$$$");

    },

    destroy: function(resourceName,params,next){  
       var error;  
       var _r;  
       try{     
          _r = resource.resources[resourceName];
          _r.destroy(params,function(err, data){ 
              next(err,data);
          });               
         }catch(e){
          error = e;
          api.log("**>>>>>>> ERROR:: destroy :: initializers:resources.js ***" + e);
        }          
    },

    updateOrCreate: function(resourceName,params,next){  
       var error;  
       var _r;  
       try{     
          _r = resource.resources[resourceName];
          _r.updateOrCreate(params,function(err, data){ 
              next(err,data);
          });               
         }catch(e){
          error = e;
          api.log("**>>>>>>> ERROR:: updateOrCreate :: initializers:resources.js ***" + e);
        }          
    },
  	
    listResourceProperties : function(resourceName, next){
       var error; 
       var resourceProperties;
       var _r; 
       try{     
          _r = resource.resources[resourceName]; 
          resourceProperties = _r.schema.properties;             
          next(null, resourceProperties);           
          
       }catch(e){
          next(e,null);        
       }          
    },
    
    getResourceProperty : function(options, next){
       var resourceName = options.resourceName;
       var propertyName = options.propertyName;
       var error; 
       var resourceProperty;
       var _r; 
       try{     
          _r = resource.resources[resourceName]; 
          resourceProperty = _r.schema.properties[propertyName];             
          next(null, resourceProperty);           
          
       }catch(e){
          next(e,null);        
       }          
    },

    createRedisKeys : function(rName,options, next) {
        var resourceName = rName;
        var createdResource = options.createdResource;
        var id = createdResource.id;

        var createResourceRecord = function(previous,baton){
          baton.take()
            var keyOptions={};
            keyOptions.id = id;
            keyOptions.keyType = "id"; 
            keyOptions.resourceName  = rName;
            var key = getRedisKey("id",keyOptions);  //bizzns::id
            console.log("key for id ===>> " + key);
            keyOptions.keyType = "ResourceRecord";
            var rrKey = getRedisKey(keyOptions.keyType, keyOptions);         
            api.redis.client.set( key, rrKey );  //point bizzns::id  to bizzns::rName::id

            var _r = resource.resources[resourceName]; 
            Object.keys(_r.schema.properties).forEach(function(property) { 
                  var value =  JSON.stringify(createdResource[property])  ;
                  var val = new Buffer(value);  //makes value to string             
                  //store the record 
                  api.redis.client.hset( '"' + rrKey + '"', property, val ,function(err,response){  
                     
                  }); 
                  baton.pass(rrKey);            
            });             
        }

        //store record fields in a set. rrKey = resource record key
        var createResourceRecordFieldSet = function(previous,baton){
          baton.take()

            var rrKey = previous; 
            var rrKey;       
            api.redis.client.hkeys('"'+rrKey+'"', function(err,replies){
                rrKeys = replies;
                console.log("rrKeys == " +  rrKeys.toString() );

                //get key at which to store field list for a resource
                var keyOptions ={};
                keyOptions.resourceName = rName;
                keyOptions.keyType = "ResourceFields";
                var rrFieldSet = getRedisKey(keyOptions.keyType, keyOptions);
                console.log("rrFieldSet == " +  rrFieldSet );


                //store fields of the resource in rrFieldSet
                rrKeys.each(function(key){
                  api.redis.client.sadd('"' + rrFieldSet + '"',  key, function (err,response){
                      //api.log("REDIS SAYS:: after sadd" + response);
                  } );

                  baton.pass(rrKey);
                });
            });
        }


        var setKeyExpires = function(previous,baton){
            baton.take();
              var rrKey = previous;
              //expire the keys after one hour -- release the memory
              api.redis.client.expire(['"' + rrKey + '"' , "3600"], function(error,response){
               //api.log("REDIS SAYS:: after expire --" + response);
              });

            baton.pass();

            next(null, {});
        }

        workflow.
            andThen(createResourceRecord).
            andThen(createResourceRecordFieldSet).
            andThen(setKeyExpires);

        workflow.start();
        
        

        
        
        

        
    }
    
  };


  next(); //goto next initializer
}
