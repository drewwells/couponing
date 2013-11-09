/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    async = require('async'),
    Coupon = mongoose.model('Coupon'),
    request = require('request'),
    _ = require('underscore');

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
            req.all = coupons;

        }
        next();
    });
};


exports.update = function(coupon) {
//    console.log('UPDATE',coupon);

    coupon.save(function(err){
        if(err)
            console.log('Updating error:',err);
    });
};


var _fresh = function(cb){
    Coupon.find({ validated: ''}).exec(function(err, coupons){
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

//_validate();

function checkCode(coupon){
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
            } else if(errors.f_code && errors.f_code === 'blocked') {
                coupon.validated = false;
                //console.log(errors.domain);
                exports.update(coupon);
            } else {
                keys = Object.keys(errors)

                if (keys.length === 1 && keys[0] === 'f_description') {
                    coupon.validated = true;
                    console.log('Valid Coupon!');
                    exports.update(coupon);
                } else {
                    console.log(errors);
                }
            }
        }

    });
}


exports.fresh = function(req, res, next){
    _fresh(function(err,coupons){
        if (err) {
            res.render('error', {
                status: 500
            });
        } else {
            req.freshCoupons = coupons;
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
    })
};

exports.good = function(req, res, next) {
    Coupon.find({ validated: 'true'}).exec(function(err, coupons){
        if (err) {
            res.render('error', {
                status: 500
            });
        } else {
            req.good = coupons;
        }
        next();
    })
};

exports.render = function(req, res) {
    res.render('coupon', {
        coupons: req.good,
        //all: req.coupons,
        //coupons: req.validated,
        content: 'Holla'
    });
};

exports.progress = function(req, res){
    var percent = Math.floor((req.good.length / req.all.length)*100*100)/100;
    res.send('Progress: ' + percent + '%');
    //res.send(JSON.stringify(req.bad));
};
