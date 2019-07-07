const irsdk = require('node-irsdk')
const WatchJS = require("melanke-watchjs")
const watch = WatchJS.watch;
const events = require("events");
const eventsEmitter = new events.EventEmitter();

// look for telemetry updates 10 times a second
var iracing = irsdk.init({telemetryUpdateInterval: 100})

//Start the object
var data = {
    Car:{
        Speed: 0,
        FuelLevel: 0,
        Gear: 0,
        IsOnTrack: false,
        IsInGarage: false,
        IsOnTrackCar: false,
        OnPitRoad: 0,
    },
    Session: {
        PlayerCarPosition: 0,
        PlayerCarClassPosition: 0,
        SessionTimeRemain: 0,
        SessionLapsRemain: 0,
    },
    Weather: {
        TrackTemp: 0,
        WindVel: 0,
        WindDir: windDirection(0)
    }
};

function windDirection(rad){
    let angle = rad * 57.2958;
    if (angle < 22.5)
        return("N")
    else if (angle < 22.5 + 45)
        return("NE")
    else if (angle < 22.5 + 90)
        return("E")
    else if (angle < 22.5 + 135)
        return("SE")
    else if (angle < 22.5 + 180)
        return("S")
    else if (angle < 22.5 + 225)
        return("SW")
    else if (angle < 22.5 + 270)
        return("W")
    else if (angle < 22.5 + 315)
        return("NW")
    else
        return("N")
}

function extractTelemetry(telemetry){

    if(!telemetry) return;

    /**
     * Car related data
     */
    //Gear
    data.Car.Gear = telemetry.values.Gear;
    //Speed
    var newSpeed = (telemetry.values.Speed)
    if((data.Car.Speed- newSpeed) > 0.1 || (newSpeed - data.Car.Speed) > 0.1) data.Car.Speed = newSpeed;
    //IsOnTrack
    data.Car.IsOnTrack = telemetry.values.IsOnTrack;
    data.Car.IsInGarage = telemetry.values.IsInGarage;
    data.Car.IsOnTrackCar = telemetry.values.IsOnTrackCar;
    data.Car.OnPitRoad = telemetry.values.OnPitRoad;
    //Fuel
    var newFuelLevel = telemetry.values.FuelLevel
    if((data.Car.FuelLevel - newFuelLevel) > 0.01 || (newFuelLevel - data.Car.FuelLevel) > 0.01) data.Car.FuelLevel = newFuelLevel;

    /**
     * Session related data
     */
    data.Session.PlayerCarPosition = telemetry.values.PlayerCarPosition;
    data.Session.PlayerCarClassPosition = telemetry.values.PlayerCarClassPosition;
    data.Session.SessionTimeRemain = telemetry.values.SessionTimeRemain;
    data.Session.SessionLapsRemain = telemetry.values.SessionTimeReamainEx;

    /**
     * Weather realted data
     */
    //Track Temp
    var newTrackTemp = telemetry.values.TrackTemp
    if((data.Weather.TrackTemp - newTrackTemp) > 0.01 || (newTrackTemp - data.Weather.TrackTemp) > 0.01) data.Weather.TrackTemp = newTrackTemp;

    data.Weather.WindVel = telemetry.values.WindVel;
    data.Weather.WindDir = windDirection(telemetry.values.WindDir);
}

iracing.on('Connected', evt => {
    eventsEmitter.emit('Connected', `iRacing Service Connected.`)
    iracing.on('Telemetry', telemetry => extractTelemetry(telemetry))
})

iracing.on('Disconnected', function (evt) {
    eventsEmitter.emit('Disconnected', `iRacing Service Disconnected.`)
    iracing.on('Telemetry', telemetry => extractTelemetry(telemetry)
})

watch(data.Car, function(prop, action, newvalue, oldvalue){
    //console.log(prop+" - action: "+action+" - new: "+newvalue+", old: "+oldvalue+"... and the context: "+JSON.stringify(this))
    eventsEmitter.emit('Car', JSON.stringify(this))
});

watch(data.Session, function(prop, action, newvalue, oldvalue){
    //console.log(prop+" - action: "+action+" - new: "+newvalue+", old: "+oldvalue+"... and the context: "+JSON.stringify(this))
    eventsEmitter.emit('Session', JSON.stringify(this))
});

watch(data.Weather, function(prop, action, newvalue, oldvalue){
    //console.log(prop+" - action: "+action+" - new: "+newvalue+", old: "+oldvalue+"... and the context: "+JSON.stringify(this))
    eventsEmitter.emit('Weather', JSON.stringify(this))
});

function getTelemetry(){
    console.log('Getting Telemetry')
    extractTelemetry(iracing.telemetry);
    eventsEmitter.emit('Car', JSON.stringify(data.Car))
    eventsEmitter.emit('Session', JSON.stringify(data.Session))
    eventsEmitter.emit('Weather', JSON.stringify(data.Weather))
}

module.exports = {
    eventsEmitter,
    getTelemetry
}