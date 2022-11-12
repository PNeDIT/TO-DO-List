const mongoose = require('mongoose');
const taskSchema = new mongoose.Schema({
name: {
    type: String,
    required: true
},
description: {
    type: String,
    required: true
},
endDate: {
    type: Date,
    default: Date.now
},
priority: {
    type: Number,
    required:true
},
comment: {
    type: String,
},
hashtag:{
    type: String,
},
superTask: {
    type: mongoose.Schema.Types.ObjectId,
}
})
module.exports = mongoose.model('Task',taskSchema);