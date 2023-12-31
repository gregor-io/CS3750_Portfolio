import express from "express";
import db from "../db/conn.mjs";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
// import User from "../db/models/User.js";

const router = express.Router();

// This section will help you get a list of all the records.
router.get("/", async (req, res) => {
    let collection = await db.collection("records");
    let results = await collection.find({}).sort({ score: 1 }).toArray();
    res.send(results).status(200);
});

// This section will help you get a single record by id
router.get("/:id", async (req, res) => {
    let collection = await db.collection("records");
    let query = {_id: new ObjectId(req.params.id)};
    let result = await collection.findOne(query);

    if (!result) res.send("Not found").status(404);
    else res.send(result).status(200);
});

// This section will help you create a new record.
router.post("/", async (req, res) => {
    const salt = bcrypt.genSaltSync();
    const hashedPassword = bcrypt.hashSync(req.body.password, salt); 

    let newUser = {
        accountType: req.body.accountType,
        username: req.body.username,
        password: hashedPassword,
        salt: salt
    }

    let collection = await db.collection("records");
    let result = await collection.insertOne(newUser);
    res.send(result).status(204);
});

// This section will help you update a record by id.
router.patch("/:id", async (req, res) => {
    const query = { _id: new ObjectId(req.params.id) };
    const updates =    {
        $set: {
            username: req.body.username,
            password: req.body.password
        }
    };

    let collection = await db.collection("records");
    let result = await collection.updateOne(query, updates);

    res.send(result).status(200);
});

// This section will help you delete a record
router.delete("/:id", async (req, res) => {
    const query = { _id: new ObjectId(req.params.id) };

    const collection = db.collection("records");
    let result = await collection.deleteOne(query);

    res.send(result).status(200);
});

export default router;