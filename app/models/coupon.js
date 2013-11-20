/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    config = require('../../config/config'),
    Schema = mongoose.Schema;


/**
 * Article Schema
 */
var CouponSchema = new Schema({
    dExpires: {
        type: Date,
        default: Date.now
    },
    Code: {
        type: String,
        default: '',
        trim: true
    },
    Expires: {
        type: String,
        default: '',
        trim: true
    },
    Site: {
        type: String,
        default: '',
        trim: true
    },
    tier: {
        type: String,
        default: '',
        trim: true
    },
    Title: {
        type: String,
        default: ''
    },
    validated: {
        type: String,
        default: ''
    },
    Tested: {
        type: String,
        default: '',
        trim: true
    },
    submitted: {
        type: Boolean,
        default: false
    }
}, {
    collection: 'unexpired'
});

/**
 * Validations
 */
CouponSchema.path('Title').validate(function(title) {
    return title.length;
}, 'Title cannot be blank');

CouponSchema.path('Code').validate(function(title) {
    return title.length;
}, 'Code cannot be blank');

/**
 * Statics
 */
CouponSchema.statics = {
    load: function(id, cb) {
        this.findOne({
            _id: id
        }).exec(cb);
    },
    byId: function(ids, cb){
        this.find({
            '_id': { $in: ids }
        }, function(err, docs){
            cb(docs);
        });
    },
    fresh: function(cb) {
        this.find({
            validated: '',
            submitted: false,
            //tier: {$exists: true, $nin: ['']},
            dExpires: {$gt: new Date()}
        })
        .sort({ tier: -1, dExpires: 1 })
        .limit(100)
        .exec(function(err, coupons){
            if(err) {
                res.render('error', {
                    status: 500
                });
            } else {
                cb(coupons);
            }
        });

    },
    good: function(cb){
        this.find({
            validated: 'true',
            submitted: false
        })
        .exec(function(err, coupons){
            if (err) {
                res.render('error', {
                    status: 500
                });
            } else {
                cb(coupons);
            }
        });
    },
    bad: function(cb){
        Coupon.find({ validated: 'false'}).exec(function(err, coupons){
            if (err) {
                res.render('error', {
                    status: 500
                });
            } else {
                console.log('BAD',coupons);
                cb(coupons);
            }
        });
    }
};

mongoose.model('Coupon', CouponSchema);