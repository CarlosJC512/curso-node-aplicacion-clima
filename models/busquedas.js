const fs = require('fs');
const axios = require('axios');

class Busquedas {
    historal = [];
    dbPath = './db/database.json';

    constructor() {
        this.leerDB();
    }

    get historialCapitalizado() {
        return this.historal.map( lugar => {

            let palabras = lugar.split(' ');
            palabras = palabras.map( p => p[0].toUpperCase() + p.substring(1) );

            return palabras.join(' ');
        });
    }

    get paramsMapbox() {
        return {
            'access_token': process.env.MAPBOX_KEY,
            'limit': 5,
            'language': 'es'
        }
    }

    get paramsOpenWeather(){
        return {
        'appid': process.env.OPENWEATHER_KEY,
        'lang': 'es',
        'units': 'metric'
    }
}

    async ciudad( lugar = '' ) {
        //peticion http
        
        const instance = axios.create({
            baseURL: `https://api.mapbox.com/geocoding/v5/mapbox.places/${ lugar }.json`,
            params: this.paramsMapbox
        });

        const resp = await instance.get();

        return resp.data.features.map( lugar => ({
            id: lugar.id,
            nombre: lugar.place_name,
            lng: lugar.center[0],
            lat: lugar.center[1],
        }));

    }

    async climaLugar( lat, lon ) {
        try {
            const instance =  axios.create({
                baseURL: `https://api.openweathermap.org/data/2.5/weather?lat=${ lat }&lon=${ lon }`,
                params: { ...this.paramsOpenWeather, lat, lon }
            });

            const resp = await instance.get();
            const { weather, main } = resp.data;
            //resp.data

            return  {
                desc: weather[0].description,
                min: main.temp_min,
                max: main.temp_max,
                temp: main.temp
            }

        } catch(err) {
            console.log(err);
        }
    }

    agregarHistorial( lugar = '' ) {
        //TODO: prevenir duplicados
        if( this.historal.includes( lugar.toLocaleLowerCase() ) ){
            return;
        }

        this.historal = this.historal.splice(0,5);

        this.historal.unshift( lugar.toLocaleLowerCase() );
    
        // Grabar en DB
        this.guardadDB();
    
    }

    guardadDB() {

        const payload = {
            historal: this.historal
        };

        fs.writeFileSync( this.dbPath, JSON.stringify( payload ) );

    }
    
    leerDB() {

        if( !fs.existsSync( this.dbPath ) ) return;

        const info = fs.readFileSync( this.dbPath, { encoding: 'utf-8' } );
        const data = JSON.parse( info );

        this.historal = data.historal;

    }
}

module.exports = Busquedas;
