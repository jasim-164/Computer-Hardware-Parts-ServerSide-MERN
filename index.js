const express= require('express');
const app= express();

const cors = require('cors');
//const jwt = require('jsonwebtoken');
require('dotenv').config();

const port= process.env.PORT ||8000;

// middleware
app.use(cors());
app.use(express.json());

app.get("/",(req, res) =>{
    res.send("data paisi");
})

app.listen(port,()=>{
    console.log("listening on port",port);
})
