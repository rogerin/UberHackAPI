const express = require('express');
const Uber = require('./uber-oauth');
const maps = require('@google/maps');
const args = process.argv.slice(2);

let route = {
    origin: args[0],
    destination: args[1],
}

let googleMapsClient = maps.createClient({
    key: process.env.GOOGLE_MAPS_API_KEY,
    //Promise: Promise
})

// var date = new Date();
// date.setDate(date.getDate() + 1);

function getPosition(address){
    console.log('Convertendo:',address)
    return new Promise( (resolve, reject)=>{
        googleMapsClient.geocode({
            address: address
        }, (err, response) => {
            if (!err) {
                let location = {
                    formatted_address: response.json.results[0].formatted_address,
                    latitude:   response.json.results[0].geometry.location.lat,
                    longitude:  response.json.results[0].geometry.location.lng
                }
                resolve(location)
            } else {
                reject(err)
            }
        });
    })
}


// getPosition(route.origin)
//     .then( function(a){
//         console.log(a)
//         getPosition(route.destination)
//             .then( b => {
//                 console.log(b)

//                 console.log()
//                 console.log()
//                 console.log('============')
//                 console.log('Origem ', a.formatted_address)
//                 console.log('Destino ', b.formatted_address)
//                 console.log('Aguarde ... . .. .. .')
                
                
                
//             } )
//     })
//     .catch(console.log)



let token = process.env.UBER_ACCESS_TOKEN;
//var token;
let URL_BASE = 'http://localhost:3000';
let URL_BASE_SANDBOX = 'http://localhost:3000';




var date = new Date();
date.setDate(date.getDate() + 1);


const axios = require('axios')

const app = express();

function createUber() {
    return new Uber({
        client_id: process.env.UBER_CLIENT_ID,
        client_secret: process.env.UBER_CLIENT_SECRET,
        redirect_uri: process.env.UBER_REDIRECT_URI || 'http://localhost:3000/api/callback'
    });
}





app.get('/api', (req, res) => {
    let response = {
        me: URL_BASE + '/api/me',
        login: URL_BASE + '/api/login',
        current: URL_BASE_SANDBOX + '/api/requests/current',
        estimates_prive: URL_BASE + '/api/estimates/price'
    }
     res.json(response)
 
 })
 
 


app.get('/api/login', (req, res) => {
    let url = createUber().getAuthorizeUrl(['history','profile', 'request', 'places']);
    res.redirect(url);
});

app.get('/api/callback', (req,res) => {
    createUber().authorizationAsync({authorization_code: req.query.code})
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

app.get('/api/products', (req, res) => {
   // axios.get('https://api.uber.com/v1.2/products?latitude=-8.061796&longitude=-34.871954', {
        axios.get('https://api.uber.com/v1.2/products?latitude=-8.061796&longitude=-34.871954', {
        
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




app.get('/api/estimates/price', (req, res) => {

    axios.get('https://api.uber.com/v1.2/estimates/price?start_latitude=-8.061796&start_longitude=-34.871954&end_latitude=-8.042849&end_longitude=-34.908664', {
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


app.get('/api/requests/estimate', (req, res) => {

    let destination = {
        start_latitude: -8.061796,
        start_longitude: -34.871954,
        end_latitude: -8.042849 ,
        end_longitude: -34.908664,
        product_id: 'd737263a-dbba-4f6e-903c-824f5f605f81'
    }

    // let destination = {
    //     start_latitude: -8.061796,
    //     start_longitude: -34.871954,
    //     end_latitude: -8.042849 ,
    //     end_longitude: -34.908664,
    //     product_id: 'd737263a-dbba-4f6e-903c-824f5f605f81'
    // }
    

    axios.post('https://api.uber.com/v1.2/requests/estimate', destination, {
        headers: {
           'Authorization': 'Bearer ' +token,
           'Accept-Language': 'pt_BR',
           'Content-Type': 'application/json'
        }
    }).then( data => {
        console.log(data.data)
        let value = data.data.fare.value;
        let fare_id = data.data.fare.fare_id;
        let display = data.data.fare.display;

        console.log(value,display,fare_id)
        res.json(data.data)
    }).catch( err => {
        res.json( {
            status: err.response.status,
            statusText: err.response.statusText
        } )
    })
})



setInterval( () => {
    

    let destination = {
        start_latitude: -22.913195,
        start_longitude: -43.181658,
        end_latitude: -22.9741253,
        end_longitude: -43.4152856,
        product_id: 'd5ef01d9-7d54-413e-b265-425948d06e92'
    }
    
    axios.post('https://api.uber.com/v1.2/requests/estimate', destination, {
        headers: {
           'Authorization': 'Bearer ' +token,
           'Accept-Language': 'pt_BR',
           'Content-Type': 'application/json'
        }
    }).then( data => {
        //console.log(data.data)
        let value = data.data.fare.value;
        let fare_id = data.data.fare.fare_id;
        let display = data.data.fare.display;
        // fare_id value,
        console.log(display)

        if(value < 90) {
            console.log('\x1b[36m', 'HORA BOA PARA CHAMAR UBER!' ,'\x1b[0m');
        } else {
            console.log('\x1b[31m', 'AGUARDE, AINDA ESTÁ CARO!!!' ,'\x1b[0m');

        }
        //es.json(data.data)
    }).catch( err => {
        console.log(err)
    })
}, 8000 )



app.listen(3000, () => {
    console.log('INICIANDO CONSULTA..');
  });
  
