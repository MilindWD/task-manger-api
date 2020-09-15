const express = require('express');
const User = require('../models/user');
const auth = require('../middleware/auth');
const multer = require('multer');
const {sendWelcomeEmail, sendCacellationEmail} = require('../emails/account');
const router = new express.Router();

router.get('/test', (req,res) => {
    res.send('From a new file');
});

router.post('/users', async (req, res) => {
    const user = new User(req.body);
    try {
        await user.save();
        sendWelcomeEmail(user.email, user.name);
        await user.generateAuthToken();
        res.status(201).send(await user.getPublicProfile());
    } catch (error) {
        res.status(400).send(error);
    }
});

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        const temp = await user.getPublicProfile();
        res.send({user: temp, token});
    } catch (error) {
        res.status(400).send();
    }
});

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => token.token!==req.token);
        await req.user.save();
        res.send('Logged out');
    } catch (error) {
        res.status(500);
    }
});

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send('Logged out of all sessions');
    } catch (error) {
        res.status(500);
    }
});



const avatar = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        const supported = ['.jpg', '.jpeg', '.png'];
        let match = false;
        supported.forEach(element => {
            if(file.originalname.endsWith(element)) {
                match = true;
            }
        });
        if(match) cb(undefined, true);
        else cb(new Error('File-Format not supported'));
    }
});

router.post('/users/me/avatar', auth, avatar.single('avatar'), async (req, res) => {
    req.user.avatar = req.file.buffer;
    await req.user.save();
    res.send();
},(error, req, res, next) => {
    res.status(400).send({ error: error.message});
});

router.get('/users/me', auth, async (req,res) => {
    res.send(await req.user.getPublicProfile());
});

router.patch('/users/me', auth, async (req,res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'age'];
    updates.forEach(element => {
        if(!allowedUpdates.includes(element)) {
            console.log('error');
            return res.status(400).send({error: 'Property '+element+' does not exist'});
        }
    });
    try {
        const user = await User.findById(req.user._id);
        updates.forEach(element => {
            user[element] = req.body[element];
        });
        await user.save();
        res.send(user);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.delete('/users/me/avatar', auth, async (req, res) => {
    const user = req.user;
    user.avatar = undefined;
    await user.save();
    res.send();
});

router.delete('/users/me', auth, async (req,res) => {
    try{
        const user = req.user;
        await req.user.remove();
        sendCacellationEmail(user.email, user.name);
        return res.status(200).send(await user.getPublicProfile());
    } catch(error) {
        console.log(error);
        res.status(500).send(error);
    }
});

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if(!user || !user.avatar) {
            throw new Error();
        }
        res.set('Content-Type', 'image/jpg');
        res.send(user.avatar);
    } catch (error) {
        res.status(404).send();
    }
})

module.exports = router;