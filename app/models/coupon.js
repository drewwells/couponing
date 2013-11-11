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
    Title: {
        type: String,
        default: ''
    },
    validated: {
        type: String,
        default: ''
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
/*ArticleSchema.statics = {
    load: function(id, cb) {
        this.findOne({
            _id: id
        }).populate('user', 'name username').exec(cb);
    }
};*/

mongoose.model('Coupon', CouponSchema);