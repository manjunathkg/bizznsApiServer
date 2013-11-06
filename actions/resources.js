var uuid = require('node-uuid');
var jWorkflow = require("jWorkflow");
var resourceWorkflow = jWorkflow.order();
var sugar = require('sugar');

exports.resources = {
  name: "resources",
  description: "I will return list of all resources managed by this server",
  inputs: {
    required: [],
    optional: [],
  },
  blockedConnectionTypes: [],
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next){
    // your logic here
    api.resources.resourcesView(function(error, resources){
      connection.error = error;      
      connection.response.resources = resources;
      next(connection, true);
    });








    
  }
};


exports.resource = {
  name: "resource",
  description: "Given a resourceName, i will return resource schema",
  inputs: {
    required: ['rName'],
    optional: [],
  },
  blockedConnectionTypes: [],
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next){
    // your logic here
      api.resources.resource(connection.params.rName,  function(error, resource){
      connection.error = error;      
      connection.response.resource = resource;
      next(connection, true);
    });
    next(connection, true);
  }
};


exports.resourceMethod = {
  name: "resourceMethod",
  description: "I will return list of all methods for a given resource",
  inputs: {
    required: ['resourceName', 'methodName','methodData'],
    optional: [],
  },
  blockedConnectionTypes: [],
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next){
    // your logic here
    var rName = connection.params.resourceName;
    var rMethod = connection.params.methodName;
    var rData = connection.params.methodData;
    api.resources.invokeResourceMethod(rName,rMethod,rData, function(error, resources){
      connection.error = error;      
      connection.response.resourceMethod = resources;
      next(connection, true);
    });
    next(connection, true);
  }
};


exports.properties = {
  name: "properties",
  description: "Given a resourcename, I will return resource properties",
  inputs: {
    required: ['resourceName'],
    optional: [],
  },
  blockedConnectionTypes: [],
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next){
    // your logic here
    api.resources.listResourceProperties(connection.params.resourceName,function(error, properties){
      connection.error = error;      
      connection.response.properties = properties;
      next(connection, true);
    });
    next(connection, true);
  }
};

exports.resourceProperty = {
  name: "resourceProperty",
  description: "Given a resourcename and a propertyname, I will return that property definition",
  inputs: {
    required: ['resourceName','propertyName'],
    optional: [],
  },
  blockedConnectionTypes: [],
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next){
    // your logic here
    api.log("############  INSIDE RESOURCE PROPERTY ########");
    var options={};
    options.resourceName = connection.params.resourceName;
    options.propertyName = connection.params.propertyName;
    api.resources.getResourceProperty(options,function(error, property){
      connection.error = error;      
      connection.response.resourceProperty = property;
      next(connection, true);
    });
    next(connection, true);
  }
};




//Get all records
exports.getAllResourceInstances = {
  name: "getAllResourceInstances",
  description: "I will return list of all instances for a given resource",
  inputs: {
    required: ['rName'],
    optional: [],
  },
  blockedConnectionTypes: [],
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next){
    // your logic here
    var rName = connection.params.rName; 
    var rData = {};
 
    api.resources.all(rName,  rData, function(error, response){
      connection.error = error;      
      connection.response.getAllResourceInstances = response;
      
      next(connection, true);
    });
    //next(connection, true);
  }
};


//Get a resource by ID
exports.getResourceByID = {
  name: "getResourceByID",
  description: "I will get a resource matching the given id",
  inputs: {
    required: ['rName','id'],
    optional: ['fields'],
  },
  blockedConnectionTypes: [],
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next){
    // your logic here
    var rName = connection.params.rName; 
    var rData = {id:connection.params.id  };
    var fields = connection.params.fields || {};
    rData = JSON.stringify(rData);  //conver to proper string
    rData = JSON.parse(rData);  //make it a proper object
    console.log("about to call find on initializers:find");
    api.resources.find(rName, fields,rData, function(error, resources){
      connection.error = error;      
      connection.response= resources;
      next(connection, true);
    });
    
  }
};




//Create a new resource
exports.createResource = {
  name: "createResource",
  description: "I will create resource instances ",
  inputs: {
    required: ['rName','data'  ],
    optional: [],
  },
  blockedConnectionTypes: [],
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next){
    // your logic here
    var rName = connection.params.rName; 
    var rData = connection.params.data; 
    rData = JSON.parse(rData);
    rData.id = rData.id || uuid(); 
    rData.name = rData.name || 'DefaultName';
    rData.url = '/' + rName + '/' + rData.id;
    rData.dateCreated = Date.create().toISOString();

     
    //workflow functions
    function createResource(previous, baton){
        baton.take();  //need this as we do a async call
          api.resources.create(rName,rData, function(error, response){
          if(error){
            connection.error = error;     

            console.log("Invalid call. could not create an instance of ") + rName;            

          }
                
          connection.response = response;            
        baton.pass(response);
        });       
    } 


    function logCreateAction(previous,baton){
      baton.take();
        if(previous){ 
          api.log("!!!! Instance of "  + rName + " created!! with ID = " + rData.id );
        }
      baton.pass(previous);
    }

    function createRedisKeys(previous, baton){
      baton.take();
        if(previous){ 
          var options ={}; 
          options.createdResource = previous;
          api.resources.createRedisKeys(rName,options,function(err,response){
            console.log("redis says " + response);
          });        
        } 
      baton.pass();    
    }

    function returnResponse(previous, baton){
      next(connection, true);
    }

    //workflow logic
    resourceWorkflow
      .andThen(createResource)
      .andThen(logCreateAction)
      .andThen(createRedisKeys)
      .andThen(returnResponse);

    //start the workflow
    resourceWorkflow.start();     
  }
};



//Get a resource by ID
exports.deleteResourceByID = {
  name: "deleteResourceByID",
  description: "I will delete a resource matching the given id",
  inputs: {
    required: ['rName', 'id'],
    optional: [],
  },
  blockedConnectionTypes: [],
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next){
    // your logic here
    var rName = connection.params.rName; 
    var rData = {id:connection.params.id};
    api.resources.destroy(rName, rData, function(error, response){
      connection.error = error;      
      connection.response.deleteResourceByID = response;
      next(connection, true);
    });
    
  }
};





//Get a resource by ID
exports.findResourcesMatching = {
  name: "findResourcesMatching",
  description: "I will find resource instances matching the given criteria",
  inputs: {
    required: ['rName', 'criteria'],
    optional: [],
  },
  blockedConnectionTypes: [],
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next){
    // your logic here
    var rName = connection.params.rName;
    var rMethod = 'find';
    var rData = {id:connection.params.criteria};     
    rData = JSON.parse(rData);
    api.resources.find(rName,rData, function(error, resources){
      connection.error = error;      
      connection.response.resources = resources;
      next(connection, true);
    });
    
  }
};



//link - Develop this further
exports.linkResourceTo = {
  name: "linkResourceTo",
  description: "I will link resource instances ",
  inputs: {
    required: ['rName','id', 'linkName', 'linked_id'  ],
    optional: [],
  },
  blockedConnectionTypes: [],
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next){
    // your logic here
    var rName = connection.params.rName;
    var rMethod = 'find';
    var rData = {id:connection.params.id};  
    api.resources.invokeResourceMethod(rName,rMethod,rData, function(error, resources){
      
      connection.error = error;      
      connection.response.resources = resources;
      next(connection, true);
    });
    
  }
};



//Update or create a new resource  
exports.updateOrCreateResourceByID = {
  name: "updateOrCreateResourceByID",
  description: "I will update or create a resource matching the given id with params sent with rData",
  inputs: {
    required: ['rName', 'id','data'],
    optional: [],
  },
  blockedConnectionTypes: [],
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next){
    // your logic here
    var rName = connection.params.rName;
    var rMethod = 'updateOrCreate';
    var rData = connection.params.data;

    rData = JSON.parse(rData);
    rData.id = connection.params.id; 
    rData.name = rData.name || 'DefaultName';
    rData.url = '/' + rName + '/' + rData.id;
    rData.dateCreated = Date.create().toISOString();


// your logic here 

    api.resources.updateOrCreate(rName,rData, function(error, resources){
      connection.error = error;      
      connection.response.resources = resources;
      next(connection, true);
    });
     
  }
};