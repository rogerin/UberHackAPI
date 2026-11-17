const express = require('express');
const Uber = require('./uber-oauth');
const createUberSession = require('./uber-session');
//const maps = require('@google/maps')


// let googleMapsClient = maps.createClient({
//     key: ''
// })

var date = new Date();
date.setDate(date.getDate() + 1);

// const query = {
//     origins: '-8.060675,-34.871916',
//     destinations: '-8.042846,-34.908639',
//     mode: 'driving',

// }

// var date = new Date();
//     date.setDate(date.getDate() + 1);
//     var DrivingOptions = {
//     departureTime: date,
//     trafficModel: 'pessimistic'
//     };


    // googleMapsClient.distanceMatrix(query, (err, result) => {
    //     console.log(result)
    // })

const axios = require('axios')

const app = express();

const uber = new Uber({
    client_id: process.env.UBER_CLIENT_ID,
    client_secret: process.env.UBER_CLIENT_SECRET,
    redirect_uri: process.env.UBER_REDIRECT_URI || 'http://localhost:3000/api/callback'
});
const auth = createUberSession(() => uber);

app.get('/api/login', auth.login);
app.get('/api/callback', auth.callback);

function sendUberError(res, err) {
    return res.json({
        status: err.response?.status || 502,
        statusText: err.response?.statusText || 'Uber request failed'
    });
}

app.get('/api/me', auth.requireToken, (req, res) => {
    axios.get('https://api.uber.com/v1.2/me', {
        headers: {
            'Authorization': 'Bearer ' + res.locals.uberAccessToken,
            'Accept-Language': 'pt_BR',
            'Content-Type': 'application/json'
        }
     }).then( data => {
         res.json(data.data)
     }).catch( err => {
        sendUberError(res, err)
    })
})

app.get('/api/payment-methods', auth.requireToken, (req, res) => {
    axios.get('https://api.uber.com/v1.2/payment-methods', {
        headers: {
           'Authorization': 'Bearer ' + res.locals.uberAccessToken,
           'Accept-Language': 'pt_BR',
           'Content-Type': 'application/json'
        }
    }).then( data => {
        res.json(data.data)
    }).catch( err => {
       sendUberError(res, err)
   })
})

app.get('/api/history', auth.requireToken, (req, res) => {
    axios.get('https://api.uber.com/v1.2/history', {
        headers: {
           'Authorization': 'Bearer ' + res.locals.uberAccessToken,
           'Accept-Language': 'pt_BR',
           'Content-Type': 'application/json'
        }
    }).then( data => {
        res.json(data.data)
    }).catch( err => {
        sendUberError(res, err)
    })
})
// https://sandbox-api.uber.com/
//https://api.uber.com/
app.get('/api/requests/current', auth.requireToken, (req, res) => {
    axios.get('https://sandbox-api.uber.com/v1.2/requests/current', {
        headers: {
           'Authorization': 'Bearer ' + res.locals.uberAccessToken,
           'Accept-Language': 'pt_BR',
           'Content-Type': 'application/json'
        }
    }).then( data => {
        res.json(data.data)
    }).catch( err => {
        sendUberError(res, err)
    })
})






if (require.main === module) {
    app.listen(3000, process.env.HOST || '127.0.0.1', () => {
        console.log('Example app listening on port 3000!');
    });
}

module.exports = app;
