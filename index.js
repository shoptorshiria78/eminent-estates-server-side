const express = require('express');
const cors = require('cors');
require("dotenv").config();
const app = express();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


// middleware
app.use(express.json());
app.use(cors())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7bvfsss.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection

    const apartmentCollections = client.db("EminentEstates").collection("apartment");
    const agreementCollections = client.db("EminentEstates").collection("agreement");
    const userInfoCollections = client.db("EminentEstates").collection("users");
    const announcementCollections = client.db("EminentEstates").collection("announcement");
    const bookedCollections = client.db("EminentEstates").collection("booked");
    const couponCollections = client.db("EminentEstates").collection("coupon");

    // middleware
    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized access" })
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.Access_Token, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" })
        }
        req.decoded = decoded;
        next();
      })

    }
    // verify admin middleware

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userInfoCollections.findOne(query);
      const isAdmin = user?.role === 'admin';

      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      next()
    }
    // verify member middleware

    const verifyMember = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userInfoCollections.findOne(query);
      const isMember = user?.role === 'member';

      if (!isMember) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      next()
    }

    // checking if it is admin
    app.get('/user/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      const query = { email: email };
      const user = await userInfoCollections.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'admin';
      }
      res.send({ admin })
    })

    //checking if it is member
    app.get('/user/member/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      const query = { email: email };
      const user = await userInfoCollections.findOne(query);
      let member = false;
      if (user) {
        member = user?.role === 'member';
      }
      res.send({ member })
    })



    // get the all apartments info
    app.get('/apartments', async (req, res) => {
      try {
        const result = await apartmentCollections.find().toArray();
        res.send(result);
      }
      catch (error) {
        console.log(error)
      }
    })
    // get all the users info
    app.get('/users', verifyToken, async (req, res) => {
      try {
        const result = await userInfoCollections.find().toArray();
        res.send(result);

      }
      catch (error) {
        console.log(error)
      }
    })

    // get all the agreementRequest
    app.get('/getAgreement', verifyToken, verifyAdmin, async (req, res) => {
      try {
        const result = await agreementCollections.find().toArray();
        res.send(result);
      } catch (error) {
        console.log(error)
      }

    })
    // get all the coupon
    app.get('/allCoupon', verifyToken, verifyAdmin, async (req, res) => {
      try {
        const result = await couponCollections.find().toArray();
        res.send(result);
      } catch (error) {
        console.log(error)
      }

    })
    // get Single Agreement
    app.get('/getAgreement/:email', verifyToken, async (req, res) => {
      try {
        const query = req.params.id;
        const result = await agreementCollections.findOne(query);
        res.send(result);
      } catch (error) {
        console.log(error)
      }

    })



    // get all the booked information
    app.get('/getBooked', verifyToken, async (req, res) => {
      try {
        const result = await bookedCollections.find().toArray();
        res.send(result);
      } catch (error) {
        console.log(error)
      }

    })
    // get all the announcement for member
    app.get('/getAnnouncement', verifyToken, verifyMember, async (req, res) => {
      try {
        const result = await announcementCollections.find().toArray();
        res.send(result);
      } catch (error) {
        console.log(error)
      }

    })

    // jwt token creation

    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.Access_Token, { expiresIn: '1h' })
      res.send({ token })
    })

    // post the user data

    app.post('/users', async(req, res) => {
      try {
        const userInfo = req.body;
        const query = { email: userInfo.email };
        const existingUser = await userInfoCollections.findOne(query);
        if (existingUser) {
          return res.send({ message: 'user already exists', insertedId: null })
        }
        const result = await userInfoCollections.insertOne(userInfo);
        res.send(result);
      }
      catch (error) {
        console.log(error)
      }

    })
    // post the agreement request
    app.post('/agreement', verifyToken, async (req, res) => {

      try {
        const agreement = req.body;
        const result = await agreementCollections.insertOne(agreement)
        res.send(result);
      }
      catch (error) {
        console.log(error)
      }
    })
    // post booked info
    app.post('/booked', verifyToken, async (req, res) => {

      try {
        const booked = req.body;
        const result = await bookedCollections.insertOne(booked)
        res.send(result);
      }
      catch (error) {
        console.log(error)
      }
    })


    // post announcement
    app.post('/announcement', verifyToken, verifyAdmin, async (req, res) => {
      try {
        const announcement = req.body;
        const result = await announcementCollections.insertOne(announcement);
        res.send(result);

      } catch (error) {
        console.log(error)
      }
    })

    // post Coupon
    app.post('/postCoupon', verifyToken, verifyAdmin, async (req, res) => {
      try {
        const coupon = req.body;
        const result = await couponCollections.insertOne(coupon);
        res.send(result);

      } catch (error) {
        console.log(error)
      }
    })
    // update agreement
    app.patch('/updateAgreement/:id', verifyToken, verifyAdmin, async (req, res) => {
      try {
        const updateAgreement = req.body;
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            status: updateAgreement.status,
            userRole: updateAgreement.userRole

          }
        }

        const result = await agreementCollections.updateOne(filter, updateDoc)
        res.send(result);


      } catch (error) {
        console.log(error)
      }
    })

    // update User
    app.patch('/updateUser/:id', verifyToken, verifyAdmin, async (req, res) => {
      try {
        const updateUser = req.body;
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            role: updateUser.role,
          }
        }

        const result = await userInfoCollections.updateOne(filter, updateDoc)
        res.send(result);


      } catch (error) {
        console.log(error)
      }
    })


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', async (req, res) => {
  res.send("server is ready")
})

app.listen(port, () => {
  console.log(`server is running on port:${port}`)
})