const express = require('express');
const Uber = require('./uber-oauth');
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

let uber = new Uber({
    client_id: process.env.UBER_CLIENT_ID,
    client_secret: process.env.UBER_CLIENT_SECRET,
    redirect_uri: process.env.UBER_REDIRECT_URI || 'http://localhost:3000/api/callback'
});

var token;


app.get('/api/login', (req, res) => {
    let url = uber.getAuthorizeUrl(['history','profile', 'request', 'places']);
    res.redirect(url);
});

app.get('/api/callback', (req,res) => {
    uber.authorizationAsync({authorization_code: req.query.code})
        .then(function([access_token, refresh_token, authorizedScopes, tokenExpiration]) {
            // store the user id and associated access_token, refresh_token, scopes and token expiration date
            console.log('... token allows access to scopes: ' + authorizedScopes);
            console.log('... token is valid until: ' + tokenExpiration);

            token = access_token;
            // redirect the user back to your actual app
            res.json({
                access_token,
                authorizedScopes,
                tokenExpiration,
                refresh_token

            });
        })
        .catch(function(err) {
            console.error('Uber authorization failed:', err.message);
            res.status(502).json({ error: 'Uber authorization failed' });
        });
});

app.get('/api/me', (req, res) => {
    axios.get('https://api.uber.com/v1.2/me', {
        headers: {
            'Authorization': 'Bearer ' +token,
            'Accept-Language': 'pt_BR',
            'Content-Type': 'application/json'
        }
     }).then( data => {
         console.log(data.data)
         res.json(data.data)
     }).catch( err => {
        res.json( {
            status: err.response.status,
            statusText: err.response.statusText
        } )
    })
})

app.get('/api/payment-methods', (req, res) => {
    axios.get('https://api.uber.com/v1.2/payment-methods', {
        headers: {
           'Authorization': 'Bearer ' +token,
           'Accept-Language': 'pt_BR',
           'Content-Type': 'application/json'
        }
    }).then( data => {
        console.log(data.data)
        res.json(data.data)
    }).catch( err => {
       res.json( {
           status: err.response.status,
           statusText: err.response.statusText
       } )
   })
})

app.get('/api/history', (req, res) => {
    axios.get('https://api.uber.com/v1.2/history', {
        headers: {
           'Authorization': 'Bearer ' +token,
           'Accept-Language': 'pt_BR',
           'Content-Type': 'application/json'
        }
    }).then( data => {
        console.log(data.data)
        res.json(data.data)
    }).catch( err => {
        res.json( {
            status: err.response.status,
            statusText: err.response.statusText
        } )
    })
})
// https://sandbox-api.uber.com/
//https://api.uber.com/
app.get('/api/requests/current', (req, res) => {
    axios.get('https://sandbox-api.uber.com/v1.2/requests/current', {
        headers: {
           'Authorization': 'Bearer ' +token,
           'Accept-Language': 'pt_BR',
           'Content-Type': 'application/json'
        }
    }).then( data => {
        res.json(data.data)
    }).catch( err => {
        res.json( {
            status: err.response.status,
            statusText: err.response.statusText
        } )
    })
})






if (require.main === module) {
    app.listen(3000, () => {
        console.log('Example app listening on port 3000!');
    });
}

module.exports = app;
