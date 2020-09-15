const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('../models/task');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if(value<0) {
                throw new Error('Age must be a positive number');
            }
        }
    },
    email: {
        type: String,
        trim: true,
        unique: true,
        lowercase: true,
        required: true,
        validate(value) {
            if(!validator.isEmail(value)){
                throw new Error('Email is invalid');
            }
        }
    },
    password: {
        type: String,
        trim: true,
        required: true,
        validate(value) {
            if(value.length<7){
                throw new Error('Password must contain atleast 7 characters');
            }
            if(value.includes('password')){
                throw new Error("Password cannot contain 'password' in it");
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
});

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
});

userSchema.methods.generateAuthToken = async function () {
    const user = this;
    const token = jwt.sign({_id: user._id.toString() }, 'helloqwerty');
    user.tokens = user.tokens.concat({token});
    await user.save();
    return token;
}

userSchema.methods.getPublicProfile = async function () {
    const user = this;
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.tokens;
    return userObj;
}

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email});
    if(!user) {
        throw new Error('Unable to Log-in');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) {
        throw new Error('Unable to Log-in');
    }
    return user;
}


userSchema.pre('save', async function (next) {
    const user = this;
    if(user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    next();
})

userSchema.pre('remove', async function (next) {
    const user = this;
    await Task.deleteMany({owner: user._id});
    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
