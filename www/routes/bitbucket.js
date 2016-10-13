var express = require('express');
var router = express.Router();
var bitbucket = require('../models/bitbucket.js')
var async = require('async')

const BITBUCKET_PROJECT = 'MOTOTRBO_INFRA_FW'
const BITBUCKET_REPO = 'comm' // ALl PR is submitted to this repo

/*convert Int to human string
  Input is in ms unit
  Output is in format : xx hours xx minutes
*/
var getDurationString = function(delta){
      const MS_PER_HOUR = 1 * 3600 * 1000
      const MS_PER_MINUTE = 1 * 60 * 1000

      var hours = Math.trunc(delta/MS_PER_HOUR)
      var minutes = Math.trunc((delta%MS_PER_HOUR)/MS_PER_MINUTE)
      var returnStr = hours+'hours '+minutes+'minutes'

      return returnStr
}

/*
  One PR's lifecycle info is get from its activities.
  After get activities, this function go through all the activity
  to get the create and merge date
*/
var getPRDuration = function(id,callback){

    bitbucket.getPRActivity(BITBUCKET_PROJECT,BITBUCKET_REPO,id,function(err,res,activity){

      if ( err || (res.statusCode < 200 || res.statusCode > 399) ) {
          // handle the error safely
          console.log('err', err)
          callback(err,null)
          return
      }

      var activity = JSON.parse(activity)

      var retObj = {}

      retObj['id'] = id

      activity.values.forEach(function(act){
        console.log(act.action)
        if(act.action == 'MERGED'){
          retObj['mergeDate'] = act.createdDate
        }else if(act.action == 'OPENED'){
          retObj['openDate'] = act.createdDate
          retObj['author'] = act.user.displayName
        }
      }

      )

      var detal = retObj['mergeDate'] - retObj['openDate']

      // compute the duration in ms unit
      retObj['duration'] = detal

      callback(null,retObj)
    })
}


var handleGetDuration = function(PRs, handleGetDurationCallback){

  var functionArray = []

  // Generate an array fill with function definition.
  // as an input for async to do parallel running
  // The only difference for the functions is the PR id of getPRDuration function
  PRs.values.forEach(function(PR){
    functionArray.push(function(callback){

                                   getPRDuration(PR.id,callback)

                                 })
  })

  // parallel running all the functions in functionArray
  // After all the function return, call the handleGetDurationCallback(results)
  async.parallel(functionArray,function(err, results){
    handleGetDurationCallback(results)
  })

}

router.get('/', function(req, res, next){

  // Step 1: get all the Merged PRs
  bitbucket.getPR(BITBUCKET_PROJECT,BITBUCKET_REPO,'MERGED',function(bitbucketErr,bitbucketRes,bitbucketBody){

    if ( bitbucketErr || (bitbucketRes.statusCode < 200 || bitbucketRes.statusCode > 399) ) {
        // handle the error safely
        console.log('err', bitbucketErr)
        return res.json({'err':bitbucketErr})
    }

    // step 2: After get all the merged PRs, go through PRs one by one,
    // to get their durations
    handleGetDuration(JSON.parse(bitbucketBody),function(resultsFromPRs){

        // step 3: After all PRs' duration get back
        var totalDuration = 0

        // get a total durations
        resultsFromPRs.forEach(function(oneResult){
          totalDuration += oneResult.duration
          // convert its format from Integer to human readable string
          oneResult.duration = getDurationString(oneResult.duration)
        })

        var averageDuration = Math.trunc(totalDuration/resultsFromPRs.length)

        var retJson = {}
        retJson['totalNum'] = resultsFromPRs.length
        retJson['averageDuration'] = getDurationString(averageDuration)
        retJson['detail'] = resultsFromPRs
        // return the json result to client
        return res.json(retJson)
    })

  })
})




module.exports = router;
