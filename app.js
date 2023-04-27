require("dotenv").config();
require("./config/database").connect();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require('axios');
const { verifyToken } = require("./middleware/auth");
// const auth = require("./middleware/auth"); 
const apiReqeust = require("supertest");             // auth OR verifyToken
// importing user context
const { User } = require("./model/user");
const app = express();
app.use(express.json());
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
const apiKey = '2cf21033-153e-48c7-8f54-f2ceca9b53e0';

// Register
app.post("/register", async (req, res) => {
    try {
        const { first_name, last_name, email, password } = req.body;

        // Validate user input
        if (!(email && password && first_name && last_name)) {
            return res.status(400).send("All input is required");
        }

        // check if user already exist OR // Validate if user exist in our database
        const oldUser = await User.findOne({ email });

        if (oldUser) {
            return res.status(409).send("User Already Exist");
        }

        //Encrypt user password
        encryptedPassword = await bcrypt.hash(password, 10);

        // Create user in our database
        const user = await User.create({
            first_name,
            last_name,
            email: email.toLowerCase(),  // sanitize: convert email to lowercase
            password: encryptedPassword,
        });

        // // Create token
        // const token = jwt.sign(
        //     { user_id: user._id, email },
        //     process.env.TOKEN_KEY,
        //     { expiresIn: "2h" }
        // );

        // // save user token
        // user.token = token;

        // return new user
        return res.status(201).json(user);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ status: false, message: "Internal Server Error" });
    }
});

// Login
app.post("/login", async (req, res) => {
    try {
        // Get user input
        const { email, password } = req.body;

        // Validating user input
        if (!(email && password)) {
            return res.status(400).send("All inputs are mandatory");
        } else {
            // Validate if user exist in our database
        const user = await User.findOne({ email });

            if (user && (await bcrypt.compare(password, user.password))) {
                // create token 
                const token = jwt.sign(
                    { user_id: user._id, email },
                    process.env.TOKEN_KEY,
                    {
                        expiresIn: "2h",
                    }
                );
                // save user token
                user.token = token;
                return res.status(200).json({ status: true, message: "Login successful", data: user });
            };
            return res.status(400).json({ status: false, message: "Password does not match" })
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json({ status: false, message: "Internal Server Error" });
    }

});

app.post("/welcome", verifyToken, async (req, res) => {
    return res.status(200).send("Welcome  🙌 ");
});

app.get("/getHttpRequest", async (req, res) => {
    try {
        const result = await apiReqeust('https://api.coinmarketcap.com/')
        .get('dexer/v3/dexer/pair-list')  //?base-address=0xe2161b01c79c3ca2079c1ba8d0fd6423fc726b67&start=1&limit=10&platform-id=14')
        .query({ 
            'base-address': '0xe2161b01c79c3ca2079c1ba8d0fd6423fc726b67',
            'start': '1',
            'limit': '10',
            'platform-id': '14'
          })
        .set('X-CMC_PRO_API_KEY', '2cf21033-153e-48c7-8f54-f2ceca9b53e0')
        .expect(200);
        console.log("RESULT", result);
        let TEXT = result.text;
        const text = JSON.parse(TEXT);
        let priceDetails = text.priceRoute;
        let usdPrice = priceDetails.destUSD;
        // console.log("USD", typeof usdPrice, Number(usdPrice).toFixed(2));
        usdPrice = Number(usdPrice).toFixed(2);

        return res.status(200).json({ status: "Ok", data: usdPrice});
    } catch (err) {
        console.log(err);
        return res.status(500).json({ status: "notOk", message: "Internal Server Error !"});
    }
});

// COINMARKET CAP Third part API
const apiUrl = 'https://api.coinmarketcap.com/dexer/v3/dexer/pair-list?base-address=0xe2161b01c79c3ca2079c1ba8d0fd6423fc726b67&start=1&limit=10&platform-id=14';

app.get('/coinmarketcap', (req, res) => {
    axios.get(apiUrl, {
      headers: {
        'X-CMC_PRO_API_KEY': apiKey
      }
    })
    .then(response => {
        // console.log("data", response.data);
      res.json(response.data.data[0].priceUsd);
    })
    .catch(error => {
      res.status(500).send('Internal Server Error!');
    });
  });

module.exports = app;