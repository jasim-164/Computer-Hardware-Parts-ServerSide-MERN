const express= require('express');
const app= express();

const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const port= process.env.PORT ||8000;

// middleware
app.use(cors());
app.use(express.json());



//require("crypto").randomBytes(64).toString("hex")
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ce4xb.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).send({ message: 'UnAuthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
      if (err) {
        return res.status(403).send({ message: 'Forbidden access' })
      }
      req.decoded = decoded;
      next();
    });
  }


async function run() {
    try{
        await client.connect();
        const hardwareCollection = client.db("computer-hardware-parts").collection("hardware-collection");
        const userCollection = client.db('computer-hardware-parts').collection('users');
        const reviewCollection = client.db('computer-hardware-parts').collection('reviews');


        app.get('/products',async(req, res) => {
            const query={};
            const cursor = hardwareCollection.find(query);
            const services =await cursor.toArray();
            res.send(services);
        })
        app.post('/products',async(req, res) => {
            const product=req.body;
            const result = await hardwareCollection.insertOne(product);
            //const  =await result.toArray();
            res.send(result);
        })
        app.get('/reviews',async(req, res) => {
          const query={};
          const cursor = reviewCollection.find(query);
          const reviews =await cursor.toArray();
          res.send(reviews);
      })
        app.post('/reviews',async(req, res) => {
          const review=req.body;
          const result = reviewCollection.insertOne(review);
          res.send(result);
      })
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
              $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ result, token });
          });
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
