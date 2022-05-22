const express= require('express');
const app= express();

const cors = require('cors');
//const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const port= process.env.PORT ||8000;

// middleware
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ce4xb.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try{
        await client.connect();
        const hardwareCollection = client.db("computer-hardware-parts").collection("hardware-collection");


        app.get('/services',async(req, res) => {
            const query={};
            const cursor = hardwareCollection.find(query);
            const services =await cursor.toArray();
            res.send(services);


        })
    }
    finally{

    }
    console.log("db is connected")
}








run().catch(console.dir);

app.get("/",(req, res) =>{
    res.send("data paisi");
})

app.listen(port,()=>{
    console.log("listening on port",port);
})
