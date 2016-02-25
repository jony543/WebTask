'use strict'

var _ = require('lodash');

var colley = require('colley-rankings');
module.exports.colley = colley;

function createRandomCompetitions(arr, n){
    var list1 = [];
    var list2 = [];
    var tempArr = [];

    while (list1.length < n){
        if (tempArr.length < 2){
            tempArr = _.concat(tempArr, arr);
        }
        var sample = _.sampleSize(tempArr, 2);
        list1.push(sample[0]);
        list2.push(sample[1]);

        _.remove(tempArr, function(item){
            return _.includes(sample,item);
        });
    }

    return {
        list1: list1,
        list2: list2
    }
}

function createRandomCompetitions2(arr, n){
    var list1 = [];
    var list2 = [];
    for (var i = arr.length; i <= n; i += arr.length) {
        var tempArr = _.shuffle(arr);
        list1 = _.concat(list1, tempArr);
        list2 = _.concat(list2, scrumble(tempArr));
    }
    if (list1.length < n){
        var tempArr = _.sampleSize(arr, _.min([ n - list1.length, _.floor(n/2)]));
        list1 = _.concat(list1, tempArr);
        list2 = _.concat(list2, _.sampleSize(_.pull(arr,tempArr), tempArr.length));
    }
    if (list1.length < n) {
        var tempArr = _.sampleSize(arr, n - list1.length);
        list1 = _.concat(list1, tempArr);
        list2 = _.concat(list2, _.sampleSize(_.pull(arr,tempArr), tempArr.length));
    }

    return {
        list1: list1,
        list2: list2
    }
};

function scrumble(arr){
    var arrCopy = _.slice(arr);
    var result = [];
    for (var i=0; i<arr.length; i++){
        var t = _.sample(arrCopy);
        while (t == arr[i]){
            t = _.sample(arrCopy);
        }
        result.push(t);
        _.pull(arrCopy, t);
    }

    return result;
}

module.exports.createRandomCompetitions = createRandomCompetitions;
module.exports.createRandomCompetitions2 = createRandomCompetitions2;
