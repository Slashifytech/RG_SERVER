const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require("helmet");
const dotenv = require("dotenv");
const cron = require('node-cron');
const Policy = require('./model/Policies')
const invoiceRoutes = require('./routes/invoicesRoute.js'); 
const adminRoutes = require('./routes/adminRoute.js'); 
const documentRoutes = require('./routes/DocumentRoute.js'); 
const policyRoutes = require('./routes/policyRoute.js'); 
const teamRoutes = require('./routes/TeamsRoute.js'); 
const userRoutes = require('./routes/userRoute.js'); 
const vehicleRoutes = require('./routes/vehicleDataRoute.js'); 


const connectDb = require('./db/mongoConnection');
http = require("http");


dotenv.config();
const app = express();
const port = process.env.PORT || 8080;


// async function mongoDBConnection(){
//     try{
//      await mongoose.connect(process.env.MONGODB_URL);
//      console.log('Connected to mongodb')
//     }catch(error)
//     {
// console.error("Error in connecting mongodb", error)
//     }
// }



cron.schedule('0 0 * * *', async () => {
  try {
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(now.getMonth() - 1);

    // Delete policies that were rejected more than 1 month ago
    await Policy.deleteMany({
      policyStatus: "rejected",
      rejectedAt: { $lte: now }
    });
    console.log('Deleted policies that were rejected more than 1 month ago.');

    // Delete policies that have been disabled for more than 1 month
    await Policy.deleteMany({
      isDisabled: true,
      disabledAt: { $lte: oneMonthAgo }
    });
    console.log('Deleted policies that have been disabled for more than 1 month.');
  } catch (err) {
    console.error('Error running cron job:', err);
  }
});

async function startServer() {
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(helmet({ crossOriginResourcePolicy: false }));
    app.use(morgan("common"));
    app.use(cors());

    const server = http.createServer(app);
    app.use('/api/v1/', invoiceRoutes);
    app.use('/api/v1/', adminRoutes);
    app.use('/api/v1/', documentRoutes);
    app.use('/api/v1/', vehicleRoutes);
    app.use('/api/v1/', policyRoutes);
    app.use('/api/v1/', userRoutes);
    app.use('/api/v1/', teamRoutes);

    app.use("/running-status", (req, res) => {
      res.status(200).send("API is connected");
    });
  
    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  }
  
  connectDb().then(startServer);
