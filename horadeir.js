const express = require('express');
const Uber = require('node-uber');
const maps = require('@google/maps');
const args = process.argv.slice(2);

let route = {
    origin: args[0],
    destination: args[1],
}

let googleMapsClient = maps.createClient({
    key: 'AIzaSyCCOckI9-kEMlS7ZDHYKA_-DkDtBK2dAKM',
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



let token = "JA.VUNmGAAAAAAAEgASAAAABwAIAAwAAAAAAAAAEgAAAAAAAAG8AAAAFAAAAAAADgAQAAQAAAAIAAwAAAAOAAAAkAAAABwAAAAEAAAAEAAAAN57ZOziRJ1SxzfB5NrZ2eRsAAAAG4wXIbDH3fkk-iY3Y9D8EWY5V5XLqhz_ZgkA3S_w08iYTNraLdbwWb-s8pMuhbW3iNrbQEoNZ7K239kQ3sDG_qMS5WZwjC-K4QZvjunPPm53rtzOyGVR0BlGFMAkwzXfVQHWL1RPxAzP-difDAAAAH2IoTjbsnPn8sNIFCQAAABiMGQ4NTgwMy0zOGEwLTQyYjMtODA2ZS03YTRjZjhlMTk2ZWU";
//var token;
let URL_BASE = 'http://localhost:3000';
let URL_BASE_SANDBOX = 'http://localhost:3000';




var date = new Date();
date.setDate(date.getDate() + 1);


const axios = require('axios')

const app = express();

let uber = new Uber({
    client_id: 'EwGTCbr922SYQHb25TKEXHEaZcp6gCl-',
    client_secret: '3zgZx8QcoaD1TPlGjplElJf2_jvuuSOrWpCiQ7Ie',
    server_token: 'HkqmgeWLgOHjSoxCsro99sWFc2DufEa19OvdG6Mn',
    redirect_uri: 'http://localhost:3000/api/callback',
    name: 'Hackathon uHack',

    language: 'pt_BR' // optional, defaults to en_US
    //sandbox: true, // optional, defaults to false
    // proxy: 'PROXY URL' // optional, defaults to none
});





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
  