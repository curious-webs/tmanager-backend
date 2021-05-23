const express = require ('express');
const app = express();
const mongoose = require ('mongoose');
let cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fileUpload = require('express-fileupload');
const dotenv = require('dotenv');
dotenv.config();


// Routes
const users = require ('./routes/users');





// exporting header  
const corsOptions = {
  exposedHeaders: 'x-auth-token',
};
app.use(cors(corsOptions));
app.use(express.static("express"));
    

app.use(express.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(fileUpload());





/** Routes */
// app.get ('/', (req, res) => {
//   res.send ('silence is golden');
// });
app.use ('/api/v1/users', users);


/*** Database */
mongoose
  .connect ('mongodb://localhost/tmanager', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then (() => console.log ('Connected to the database'))
  .catch (e => console.log ('Could not connect to database', e.message));

const port = process.env.PORT || 4000;
app.listen (port, console.log ('listening on port: ' + port));
