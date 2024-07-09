const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;

//middle ware
app.use(cors());
app.use(express.json());

// MONGODB CONNECTION STRING

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.di78vms.mongodb.net/BariVara?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();
    //DATABASE AND COLLECTION STARTS

    const database = client.db("BariVara");
    const categoriesCollection = database.collection("categories");
    const roomsCollection = database.collection("rooms");
    const meterNumbersCollection = database.collection("meterNumbers");
    const monthlyDataCollection = database.collection("monthlyMeterData");

    // DATABASE AND COLLECTION ENDS

    // PURCHASE ROUTES

    // CREATE category
    app.post("/categories", async (req, res) => {
      let category = req.body;
      category = { ...category, createdAt: new Date().toISOString() };
      console.log("New category", category);
      const result = await categoriesCollection.insertOne(category);
      res.send(result);
    });
    // GET ALL categories
    app.get("/categories", async (req, res) => {
      const cursor = categoriesCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    // Delete One category
    app.delete("/categories/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await categoriesCollection.deleteOne(query);

      res.send(result);
      if (result.deletedCount === 1) {
        console.log("Successfully deleted one document.");
      } else {
        console.log("No documents matched the query. Deleted 0 documents.");
      }
    });

    // ROOMS  ROUTES

    // GET ALL ROOMS
    app.get("/rooms", async (req, res) => {
      const cursor = roomsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // METER NUMBER ROUTES

    // GET ALL METER NUMBERS
    app.get("/meter", async (req, res) => {
      const cursor = meterNumbersCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    // Delete One meterNumber
    app.delete("/meter/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await meterNumbersCollection.deleteOne(query);

      res.send(result);
      if (result.deletedCount === 1) {
        console.log("Successfully deleted one document.");
      } else {
        console.log("No documents matched the query. Deleted 0 documents.");
      }
    });

    //MONTHLY DATA ROUTES

    // Get data by month and year
    app.get("/monthlyData", async (req, res) => {
      const { month,year } = req.query;
     
      console.log( month,year);
      try {
        let query = {};
        if (year) query.year = parseInt(year, 10);
        if (month) query.month = month;

        const data = await monthlyDataCollection.find(query).toArray();

        res.status(200).json(data);
      } catch (err) {
        res.status(500).send("Error retrieving data: " + err.message);
      }
    });
    //Monthly data INSERT
    app.post("/monthlyData", async (req, res) => {
      const { year, month, roomNo, meterNumber } = req.body;
      const createdAt = new Date();

      try {
        const filter = { year, month };
        const existingData = await monthlyDataCollection.findOne(filter);

        if (existingData) {
          const roomExists = existingData.meterReadings.some(
            (reading) => reading.roomNo === roomNo
          );
          if (roomExists) {
            return res
              .status(400)
              .send(
                "Error: Meter reading for this room has already been inserted for this month."
              );
          }
        }

        const update = {
          $push: { meterReadings: { roomNo, meterNumber, createdAt } },
        };
        const options = { upsert: true };

        await monthlyDataCollection.updateOne(filter, update, options);

        res.status(200).send("Meter reading saved successfully");
      } catch (err) {
        res.status(500).send("Error saving meter reading: " + err.message);
      }
    });
    // Cost ROUTES

    //CREATE cost
    app.post("/cost", async (req, res) => {
      let cost = req.body;
      cost = { ...cost, createdAt: new Date().toISOString() };
      console.log("New cost", cost);
      const result = await costCollection.insertOne(cost);
      res.send(result);
    });
    //Get ALL cost
    app.get("/cost", async (req, res) => {
      const cursor = costCollection.find().sort({ createdAt: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });
    // delete one cost
    app.delete("/cost/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await costCollection.deleteOne(query);

      res.send(result);
      if (result.deletedCount === 1) {
        console.log("Successfully deleted one document.");
      } else {
        console.log("No documents matched the query. Deleted 0 documents.");
      }
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// server backend

app.get("/", (req, res) => {
  res.send("BariVara server is on and running...");
});

app.listen(port, () => {
  console.log(`Your server is running on PORT : ${port}`);
});
