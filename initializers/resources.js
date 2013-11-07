var resource = require('resource');
var resources = require('resources');

var jWorkflow = require("jWorkflow");
var workflow = jWorkflow.order();
var sugar = require('sugar');


//
// Use the web admin resource
//

var getRedisKey = function(keyType,options,next){
        var options = options || {};
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
  api.redis.client.on("error", function (err) {
      console.log("error event - " + client.host + ":" + client.port + " - " + err);
  });

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

    //get resource given resource name and id
    get: function(resourceName,fields,id,next){  
       var error;  
       var _r;  
       try{     
          _r = resource.resources[resourceName];
          _r.get(id,function(err, data){ 
              next(err,data);
          });               
         }catch(e){           
          api.log("**>>>>>>> ERROR:: get :: initializers:resources.js ***" + e);
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
               
           var findResourcesMatchinCriteria = function(previous,baton){
            api.log("inside findResourcesMatchinCriteria");
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
            api.log("inside loadResourcesIntoRedis");
              var passedDataRecordsAarray = previous;
              passedDataRecordsAarray.each(function(record){ 
                //api.log("**************  INSIDE passedDataRecordsAarray record " + JSON.stringify(record));
                //try to get resource record for redis.. if doesnt exist, load into redis
                var keyOptions = {id:record.id};
                var recordKey = getRedisKey('id',keyOptions);
                api.log("==========>>> " + recordKey);
                var rrKey;
                recordKey = new Buffer(recordKey); 
                rrKey = getRedisKey('ResourceRecord',{resourceName : resourceName, id: record.id});           
                api.redis.client.get(recordKey,function(err,reply){
                    if(err==null && reply == null){
                      api.redis.client.set(recordKey, rrKey , function(err, reply){
                          //api.log('recordKey::reply from redis == >>' + reply);
                          //api.log(">>>>>>> Inserted rrKey = " + rrKey + " into  recordKey = " + recordKey);
                      });                } 
                });
                api.redis.client.hlen(rrKey, function(err,replies){
                      api.log("rrKey ===> " + rrKey);
                      api.log('rrKey::err == >>' + err);
                      api.log('rrKey::replies == >>' + JSON.stringify(replies) );
                      if(err == null && replies == 0 ){ 
                          var _r = resource.resources[resourceName]; 
                          Object.keys(_r.schema.properties).forEach(function(property) { 
                                var value =  JSON.stringify(record[property])  ;
                                var val = new Buffer(value);  //makes value to string 
                                rrKey = new Buffer(rrKey) ;           
                                //store the record 
                                api.redis.client.hset( rrKey, property, val ,function(err,response){  
                                   //set expiry to one hr
                                   api.redis.client.expire(rrKey,3600,function(err,res){});
                                });                                        
                          });   
                      }
                      else{ //record exists use it..
                          baton.pass(previous) ;
                      }
                });            
              });
              baton.pass(previous);
            } 

          var filterForTheNeededFields = function(previous, baton){        
            api.log("inside filterForTheNeededFields");
            baton.take();


            baton.pass(previous);
          }

          var returnResponse = function(previous, baton){        
            api.log("inside returnResponse");
            next(null,previous);
          }

           //workflow logic
          workflow
            .andThen(findResourcesMatchinCriteria)
            .andThen(loadResourcesIntoRedis)
            .andThen(filterForTheNeededFields)
            .andThen(returnResponse);
          //find workflow start
          workflow.start(); 
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

    linkResourceTo: function(resourceName,linkedField,params,next){ 
       api.log("======== linkResource to params begin == " + JSON.stringify(params)  ); 
       var error;  
       var _r;  
       try{     
          _r = resource.resources[resourceName];
          //see if link field has existing ids attached
          var rid = params["id"];
          api.log("rid being sent is " + rid + " resourceName == " + resourceName);
          var linkedFieldValues;
          _r.get(rid, function(err, resource){
            //api.log("resource got back is == " + JSON.stringify(resource)  );
            if(err){
              api.log("Error getting rid = " + rid + " Err was " + err);
              next(err,null);
              return;
            }

            if(resource == null){  //no target object
              _r.create({id:rid}, function(err, createdResource){
                  resource = createdResource;
              })
            }
            
            var tmplinkedField = resource[linkedField];
            api.log("===>> tmplinkedField resource " + JSON.stringify(tmplinkedField));
            var resType = params[linkedField].ResourceType;

             if(tmplinkedField['id'] == null || tmplinkedField['id'] == undefined){
                api.log("===>> resType from param == " + resType);
                tmplinkedField = tmplinkedField[resType]; //ex: Person Or Organization
                tmplinkedField = tmplinkedField.id;

                linkedFieldValues = tmplinkedField || []; 
                 api.log("linkedFieldValues from db == " +  JSON.stringify(linkedFieldValues) ) ;
                linkedFieldValues = linkedFieldValues.add(params[linkedField].id);
                params[linkedField] = {};
                params[linkedField][resType] = {id:linkedFieldValues,ResourceType:resType};
             }else{
                 tmplinkedField = tmplinkedField.id;

                 linkedFieldValues = tmplinkedField || [];
                 api.log("linkedFieldValues from db == " +  JSON.stringify(linkedFieldValues) ); 
                 linkedFieldValues = linkedFieldValues.add(params[linkedField].id);
                 params[linkedField] = {};
                 params[linkedField] = {id:linkedFieldValues,ResourceType:resType};
             }
              

             api.log("======== linkResource to params == " + JSON.stringify(params)  );
             _r.updateOrCreate(params,function(err, data){ 
              next(err,data);
          });               

          });
          
         }catch(e){
          error = e;
          api.log("**>>>>>>> ERROR:: linkResourceTo :: initializers:resources.js ***" + e);
          next(e,null);
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
                  rrKey = new Buffer(rrKey) ;            
                  //store the record 
                  api.redis.client.hset( rrKey, property, val ,function(err,response){  
                     baton.pass(rrKey);
                  });                               
            }); 
                        
        }

        //store record fields in a set. rrKey = resource record key
        var createResourceRecordFieldSet = function(previous,baton){
          baton.take()

            var rrKey = previous; 
            var rrKey;   
            //get key at which to store field list for a resource
            var keyOptions ={};
            keyOptions.resourceName = rName;
            keyOptions.keyType = "ResourceFields";
            var rrFieldSet = getRedisKey(keyOptions.keyType, keyOptions);

            //if resource keyset exists, no need to create again
            if(!api.redis.client.exists(rrFieldSet)){
                api.redis.client.hkeys(new Buffer(rrKey), function(err,replies){
                    rrKeys = replies;
                    //console.log("rrKeys == " +  rrKeys.toString() );
                    
                    //store fields of the resource in rrFieldSet
                    rrKeys.each(function(key){
                      api.redis.client.sadd(new Buffer(rrFieldSet) ,  key, function (err,response){
                          //api.log("REDIS SAYS:: after sadd" + response);
                      } );                  
                    });
                });
            }
            baton.pass(rrKey);
        }


        var setKeyExpires = function(previous,baton){
            baton.take();
              var rrKey = previous;
              //expire the keys after one hour -- release the memory
              api.redis.client.expire([new Buffer(rrKey)  , "3600"], function(error,response){
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
