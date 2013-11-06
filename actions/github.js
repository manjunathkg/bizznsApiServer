var jWorkflow = require("jWorkflow");
var githubWorkflow = jWorkflow.order();


exports.action = {
  name: "github",
  description: "I will list github activities of a given user",
  inputs: {
    required: ['githubUserName'],
    optional: [],
  },
  blockedConnectionTypes: [],
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next){
     

    //workflow functions
    function getGithubActivity(previous, baton){
        baton.take();  //need this as we do a async call
        api.resources.invokeResourceMethod('github','activity',
                        {'user' : connection.params.githubUserName},
                        function(error, activityList){
        connection.error = error;      
        connection.response.activityList = activityList;  
        baton.pass();       
      });
    }


    function logGithubActivity(previous,baton){
      api.log("!!!!  This was logged after we got github activity for " 
                  + connection.params.githubUserName);
    }

    function returnResponse(previous, baton){
      next(connection, true);
    }

    //workflow logic
    githubWorkflow
      .andThen(getGithubActivity)
      .andThen(logGithubActivity)
      .andThen(returnResponse);

    //start the workflow
    githubWorkflow.start();






    //call the resource github, method activity, params with arguments for activity and a callback function
    
    
  }
};













 