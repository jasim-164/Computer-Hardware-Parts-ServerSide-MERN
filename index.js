const express= require('express');
const app= express();

const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const port= process.env.PORT ||8000;

console.log(stripe);

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
        const bookingCollection = client.db('computer-hardware-parts').collection('bookings');
        const paymentCollection = client.db('computer-hardware-parts').collection('payments');




        app.get('/products',async(req, res) => {
            const query={};
            const cursor = hardwareCollection.find(query);
            const services =await cursor.toArray();
            res.send(services);
        })
        app.get('/products/:id',async(req, res) => {
            const id=req.params.id;
            const query={_id: id}
            const cursor = await hardwareCollection.findOne(query);
            // const services =await cursor.toArray();
            res.send(cursor);
        })
        app.post('/products',async(req, res) => {
            const product=req.body;
            const result = await hardwareCollection.insertOne(product);
            //const  =await result.toArray();
            res.send(result);
        })
        app.delete('/products/:id',async(req, res) => {
          const id=req.params.id;
          const query={_id:id}
          const result = await hardwareCollection.deleteOne(query);
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
          const result =await reviewCollection.insertOne(review);
          res.send(result);
      })

      app.get('/user/:email',async(req, res) =>{
        const query={};
        const email = req.params.email;
        const filter = { email: email };
        const cursor = await userCollection.findOne(filter);
        // const user =await cursor.toArray();
        res.send(cursor);
       

      })
      app.get('/user',async(req, res) =>{
        const query={};
        const cursor =  userCollection.find(query);
        const users =await cursor.toArray();
        res.send(users);
        console.log("user collection")

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


          //admin
          app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin })
          })
          app.put('/user/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            console.log("admin",email);
            const filter = { email: email };
            const updateDoc = {
              $set: { role: 'admin' },
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
          })
          //booking
          app.post('/booking', async (req, res) => {
            const booking = req.body;
            // const query = { treatment: booking.treatment, date: booking.date, patient: booking.patient }
            // const exists = await bookingCollection.findOne(query);
            // if (exists) {
            //   return res.send({ success: false, booking: exists })
            // }
            const result = await bookingCollection.insertOne(booking);
            
           
            return res.send({ success: true, result });
          });
          app.get('/booking', async (req, res) => {
    
            const query = { };
            const bookings = await bookingCollection.find(query).toArray();
            console.log(bookings)
            return res.send(bookings);
          });

          app.get('/booking/:id', async(req, res) =>{
            const id = req.params.id;
            const query = {_id: id};
            const booking = await bookingCollection.findOne(query);
            res.send(booking);
          })


          app.post('/create-payment-intent', verifyJWT, async(req, res) =>{
            const service = req.body;
            const price = service.price;
            const amount = price*100;
            const paymentIntent = await stripe.paymentIntents.create({
              amount : amount,
              currency: 'usd',
              payment_method_types:['card']
            });
            res.send({clientSecret: paymentIntent.client_secret})
          });
          app.patch('/booking/:id', verifyJWT, async(req, res) =>{
            const id  = req.params.id;
            const payment = req.body;
            const filter = {_id: ObjectId(id)};
            const updatedDoc = {
              $set: {
                paid: true,
                transactionId: payment.transactionId
              }
            }
      
            const result = await paymentCollection.insertOne(payment);
            const updatedBooking = await bookingCollection.updateOne(filter, updatedDoc);
            res.send(updatedBooking);
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
