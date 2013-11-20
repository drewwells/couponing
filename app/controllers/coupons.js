/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    heapdump = require('heapdump'),
    async = require('async'),
    Coupon = mongoose.model('Coupon'),
    Store = mongoose.model('Store'),
    request = require('request'),
    _ = require('underscore'),
    numberToProcess = 25;

exports.count = function(req, res, next) {
    Coupon.count().exec(function(err, c) {
        res.locals.count = c;
        next();
    });
};

exports.coupon = function(req,res,next,id) {
    Coupon.load(id, function(err, coupon){
        res.locals.coupon = coupon;
    });
};

//Process a few coupons
exports.process = function(req, res, next) {

    Coupon.fresh(function(fresh){

        var async,
            nums = numberToProcess,
            //fresh = res.locals.fresh.slice(),
            startTime = new Date();
        //Mark all & refresh pressed
        if(req.query && req.query.couponIds){
            nums = 5;
        }
        //Death after 10seconds
        setTimeout(function(){
            console.log('500: aborting ajax call');
            next();
        }, 10000);

        var coupons = fresh.splice(0,nums);
        function iterate(){
            if(!coupons) {
                next();
                return;
            }
            var coupon = coupons.pop();
            if( coupon ){
                checkCode(coupon,iterate);
            } else {
                next();
            }
        }
        iterate();
    });
};

function checkCode(coupon, cb){
    var code = coupon.Code;
    if(/,/.test(code)) {
        code = code.split(',')[0];
    }
    request({
        url:'http://www.retailmenot.com/ajax/checkCode.php',
        method: 'POST',
        timeout: 3000,
        json: true,
        form: {
            domain: coupon.Site,
            f_code: code,
            offerType: 'code'
        }
    }, function(err, res, data){

        var keys, errors;
        if(err){
            console.log('500: Error');
            console.log(err);
            return;
        }
        if(res.statusCode !== 200){
            console.log('500: SOMETHING WENT WRONG');
            return;
        }
        if(!data){
            console.log('500: No data returned');
            return;
        }
        errors = data.errors;

        if(errors) {
            if(errors.f_code && errors.f_code === 'exists') {
                coupon.validated = false;
            } else if(errors.domain && errors.domain === 'missing') {
                coupon.validated = false;
            } else if(errors.domain && errors.domain === 'not-accepting-code') {
                coupon.validated = false;
            } else if(errors.domain && errors.domain === 'not-accepting-state') {
                coupon.validated = false;
            } else if(errors.domain && errors.domain === 'incorrect') {
                coupon.validated = false;
            } else if(errors.f_code && errors.f_code === 'missing-code') {
                coupon.validated = false;
            } else if(errors.f_code && errors.f_code === 'blocked') {
                coupon.validated = false;
            } else if(errors.f_code && errors.f_code === 'long') {
                coupon.validated = false;
            } else {
                keys = Object.keys(errors);

                if (keys.length === 1 && keys[0] === 'f_description') {
                    coupon.validated = true;
                    console.log('Valid Coupon!');
                } else {
                    console.log(coupon);
                    console.log(errors);
                }
            }
        }

        if( coupon.validated !== ''){
            coupon.save(function(){
                cb();
            });
        }  else {
            cb();
        }
    });
}

exports.renderStores = function(req, res) {
    Store.find().sort({Store:1}).exec(function(err,stores){
        res.render('store', {
            stores: stores
        });
    });
};

exports.submitIds = function(req, res, next){
    Coupon.byId(req.query.couponIds,function(coupons){
        function popDoc() {
            var doc;

            if( coupons.length ) {
                doc = coupons.pop();
                doc.submitted = true;
                doc.save(function(){
                    popDoc();
                });
            } else {
                res.json({ success: true, couponIds: req.query.couponIds });
            }
        }
        if( coupons ) {
            popDoc();
        }
    });
};

exports.render = function(req, res) {
    Coupon.good(function(good){
        var num = 10,
            //good = res.locals.good,
            start = Math.floor(Math.random()*(good.length - num)),
            randomCoupons = [];
        if(start+num <= good.length) {
            randomCoupons = good.slice(start, start+num);
        } else {
            randomCoupons = good.slice(-num);
        }
        res.render('coupon', {
            readyToSubmit: good.length,
            coupons: randomCoupons,
            processMore: !good.length
        });
    });

};

exports.progress = function(req, res){
    //var good = res.locals.good;
    Coupon.good(function(good){

        var count = res.locals.count;
        var percent = Math.floor(((good.length + numberToProcess) / count)*100*100)/100;
        var remaining = count - good.length + numberToProcess;
        res.render('progress', {
            count: count,
            progress: percent,
            readyToSubmit: good.length,
            remaining: remaining,
            processed: numberToProcess,
            time: new Date() - res.locals.req._startTime
        });
    });
};