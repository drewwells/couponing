/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    async = require('async'),
    _ = require('underscore');


var $ = require('cheerio');
var request = require('request');

var imageURLs = [];

function gotHTML(err, res, html) {
    if (err){

        return console.error(err);
    }
    var $html = $.load(html);
    // get all img tags and loop over them
    var i = 5;

    $html('a.jobtitle').map(function(i, link) {

        if( i===0 ){
            return;
        }
        i--;
        var href = $(link).attr('href');

        request(host + href,function(err,res,html){
            imageURLs.push($.load(html)('title, h1').html());
        });
        //imageURLs.push(domain + href);
    });

}
var host = 'http://www.indeed.com';
var domain = 'http://www.indeed.com/jobs?q=javascript&l=Austin%2C+TX';

exports.render = function(req, res, next) {
    //imageURLs = [];
    var URLs = request(domain, gotHTML);

    res.send(imageURLs);
};
