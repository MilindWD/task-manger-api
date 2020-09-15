const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth');
const User = require('../models/user');
const router = new express.Router();


router.post('/tasks', auth, async (req, res) => {
    const task = new Task(req.body);
    task.owner = req.user._id;
    try {
        await task.save();
        res.status(201).send(task);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.get('/tasks', auth, async (req, res) => {
    const _id = req.user._id;
    const match = {};
    const sort = {};
    if(req.query.completed) {
        match.completed = req.query.completed==='true'?true:false;
    }
    if(req.query.sortBy) {
        const parts = req.query.sortBy.split('_');
        sort[parts[0]] = parts[1]=='asc'?1:-1;
    }
    try{
        const user = await User.findById(_id);
        await user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate();
        res.status(200).send(user.tasks);
    } catch (error) {
        res.status(404);
    }
    
});

router.get('/tasks/:id', auth, async (req,res) => {
    const _id = req.params.id;
    try {
        const task = await Task.findOne({_id, owner: req.user._id});
        if(!task) {
            return res.status(404).send();
        }
        res.status(201).send(task);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.patch('/tasks/:id', auth, async (req,res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['completed', 'description'];
    updates.forEach(element => {
        if(!allowedUpdates.includes(element)) {
            return res.status(400).send({error: 'Property '+element+' does not exist'});
        }
    });
    try {
        const task = await Task.findOne({_id: req.params.id, owner: req.user._id});
        // const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if(!task) {
            return res.status(404).send();
        }
        updates.forEach(element => {
            task[element] = req.body[element];
        });
        await task.save();
        res.send(task);
    } catch (error) {
        console.log(error);
        res.status(400).send(error);
    }
});

router.delete('/tasks/:id', auth, async (req,res) => {
    try{
        const task = await Task.findOne({_id: req.params.id, owner: req.user._id});
        if(!task) {
            return res.status(404).send('Task not found');
        }
        await Task.findByIdAndDelete(req.params.id);
        return res.status(200).send(task);
    } catch(error) {
        res.status(500).send(error);
    }
});

module.exports = router;