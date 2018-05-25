const express = require('express');
const Uber = require('node-uber');
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
    client_id: '-',
    client_secret: '',
    server_token: '',
    redirect_uri: 'http://localhost:3000/api/callback',
    name: 'Hackathon uHack',

    language: 'pt_BR' // optional, defaults to en_US
    //sandbox: true, // optional, defaults to false
    // proxy: 'PROXY URL' // optional, defaults to none
});

//var token = "KA.eyJ2ZXJzaW9uIjoyLcGVsaW5lX2tleV9pZCI6Ik1RPT0iLCJwaXBlbGluZV9pZCI6MX0.DVV3WYZQkb5pWHHU9ag0IhkQBfhq5lPtIJsPZnI9-yA";
var token;
console.log(token)


app.get('/api/login', (req, res) => {
    let url = uber.getAuthorizeUrl(['history','profile', 'request', 'places']);
    res.redirect(url);
});

app.get('/api/callback', (req,res) => {
    uber.authorizationAsync({authorization_code: req.query.code})
        .spread(function(access_token, refresh_token, authorizedScopes, tokenExpiration) {
            // store the user id and associated access_token, refresh_token, scopes and token expiration date
            console.log('New access_token retrieved: ' + access_token);
            console.log('... token allows access to scopes: ' + authorizedScopes);
            console.log('... token is valid until: ' + tokenExpiration);
            console.log('... after token expiration, re-authorize using refresh_token: ' + refresh_token);

            token = access_token;
            // redirect the user back to your actual app
            res.json({
                access_token,
                authorizedScopes,
                tokenExpiration,
                refresh_token

            });
        })
        .error(function(err) {
            console.error(err);
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






app.listen(3000, () => {
  console.log('Example app listening on port 3000!');
});
