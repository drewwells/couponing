/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    config = require('../../config/config'),
    Schema = mongoose.Schema;


/**
 * Article Schema
 */
var StoreSchema = new Schema({
    Store: {
        type: String,
        trim: true
    },
    Tier: {
        type: String,
        default: '',
        trim: true
    }
}, {
    collection: 'tiered'
});

/**
 * Validations
 *
CouponSchema.path('Title').validate(function(title) {
    return title.length;
}, 'Title cannot be blank');

CouponSchema.path('Code').validate(function(title) {
    return title.length;
}, 'Code cannot be blank');

**
 * Statics
 */
StoreSchema.statics = {
    load: function(id, cb) {
        this.findOne({
            _id: id
        }).exec(cb);
    }
};

mongoose.model('Store', StoreSchema);