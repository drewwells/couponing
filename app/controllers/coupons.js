/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    async = require('async'),
    Coupon = mongoose.model('Coupon'),
    request = require('request'),
    _ = require('underscore'),
    numberToProcess = 25;

/**
 * List of Articles
 */
exports.all = function(req, res, next) {
    Coupon.find().sort('Site')/*.populate('user', 'name username')*/.exec(function(err, coupons) {
        if (err) {
            res.render('error', {
                status: 500
            });
        } else {
            res.locals.all = coupons;

        }
        next();
    });
};

exports.coupon = function(req,res,next,id) {
    Coupon.load(id, function(err, coupon){
        res.locals.coupon = coupon;
    });
};

exports.coupons = function(req,res,next) {
    var id, ids = req.query.couponIds;
    res.locals.couponIds = req.query.couponIds;
    Coupon.find({
        '_id': { $in: ids }
    }, function(err, docs){
        res.locals.coupons = docs;
        next();
    });
};

exports.update = function(coupon, next) {
    coupon.save(function(err){
        if(err){
            console.log('Updating error:',err);
        } else {
            if( next ){
                next();
            }
        }
    });
};


var _fresh = function(cb){
    Coupon.find({ validated: '', submitted: false})
    .sort({ dExpires: 1 })
    //This is run a lot, limit size of query
    .limit(100)
    .exec(function(err, coupons){
        cb(err, coupons);
    });
};

var _validate = function() {
    _fresh(function(err, coupons){
        function tick(){
            if(coupons.length > 0) {
                coupons.splice(0,50).forEach(function(coupon){
                    checkCode(coupon);
                });
            }
        }
        setInterval(tick,12250);
    });
};
//Process a few coupons
exports.process = function(req, res, next) {

    var nums = numberToProcess, fresh = res.locals.fresh.slice();
    if(req.query && req.query.couponIds){
        nums = 5;
    }
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
};

function checkCode(coupon, cb){
    request({
        url:'http://www.retailmenot.com/ajax/checkCode.php',
        method: 'POST',
        json: true,
        form: {
            domain: coupon.Site,
            f_code: coupon.Code,
            offerType: 'code'
        }
    },function(err, res, data){
        var keys, errors = data.errors;
        if(res.statusCode !== 200){
            console.log('500: SOMETHING WENT WRONG');
        }
        if(errors) {
            if(errors.f_code && errors.f_code === 'exists') {
                coupon.validated = false;
                //console.log(errors.f_code);
                exports.update(coupon);
            } else if(errors.domain && errors.domain === 'not-accepting-code') {
                coupon.validated = false;
                //console.log(errors.domain);
                exports.update(coupon);
            } else if(errors.domain && errors.domain === 'not-accepting-state') {
                coupon.validated = false;
                //console.log(errors.domain);
                exports.update(coupon);
            } else if(errors.domain && errors.domain === 'incorrect') {
                coupon.validated = false;
                //console.log(errors.domain);
                exports.update(coupon);
            } else if(errors.f_code && errors.f_code === 'blocked') {
                coupon.validated = false;
                //console.log(errors.domain);
                exports.update(coupon);
            } else {
                keys = Object.keys(errors);

                if (keys.length === 1 && keys[0] === 'f_description') {
                    coupon.validated = true;
                    console.log('Valid Coupon!');
                    exports.update(coupon);
                } else {
                    console.log(coupon);
                    console.log(errors);
                }
            }
        }
        cb();
    });
}


exports.fresh = function(req, res, next){
    _fresh(function(err,coupons){
        if (err) {
            res.render('error', {
                status: 500
            });
        } else {
            res.locals.fresh = coupons;
        }
        next();
    });
};

exports.bad = function(req, res, next) {
    Coupon.find({ validated: 'false'}).exec(function(err, coupons){
        if (err) {
            res.render('error', {
                status: 500
            });
        } else {
            console.log('BAD',coupons);
            req.bad = coupons;
        }
        next();
    });
};

exports.good = function(req, res, next) {
    Coupon.find({ validated: 'true', submitted: false}).exec(function(err, coupons){
        if (err) {
            res.render('error', {
                status: 500
            });
        } else {
            res.locals.good = coupons;
        }
        next();
    });
};

exports.submitIds = function(req, res, next){
    function popDoc() {
        var doc;
        if( res.locals.coupons.length ) {
            doc = res.locals.coupons.pop();
            doc.submitted = true;
            exports.update(doc, function(){
                popDoc();
            });
        } else {
            res.json({ success: true, couponIds: res.locals.couponIds });
        }
    }
    if( res.locals.coupons ) {
        popDoc();
    }

};

exports.render = function(req, res) {
    var num = 10,
        coupons = res.locals.good,
        start = Math.floor(Math.random()*(coupons.length - num)),
        randomCoupons = [];
    if(start+num <= coupons.length) {
        randomCoupons = coupons.slice(start, start+num);
    }
    res.render('coupon', {
        count: coupons.length,
        coupons: randomCoupons,
        processMore: !!coupons.length
    });
};

exports.progress = function(req, res){
    var good = res.locals.good;
    var execution = new Date() - res.locals.req._startTime;
    var percent = Math.floor(((good.length + numberToProcess) / res.locals.all.length)*100*100)/100;
    var remaining = res.locals.all.length - good.length + numberToProcess;
    res.send('Progress: ' + percent + '%<br/>' + 'Left to validate: ' +
             remaining + '<br/>' +
             'Validated ' + numberToProcess + ' coupons in ' + execution + 'ms');
    //res.send(JSON.stringify(req.bad));
};
