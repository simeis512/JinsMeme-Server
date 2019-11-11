'use strict';

// in windows
module.exports.noble_type = 'noble-uwp';

const os = require('os');
const fs = require('fs');
const request = require('request');
const config = require('config');

const WebSocketServer = require('ws').Server

const MemeDevice = require('jinsmemesdk-node-noble-x');


// Post this machine's local IP address to server.
const postData = 'key='+ config.lan_ip_exchanger_key +'&ip='+ getLocalAddress();

request.post({
  url: config.lan_ip_exchanger_url,
  headers: {
    "content-type": "application/x-www-form-urlencoded"
  },
  body: postData
}, function (error, response, body){
  if (body.indexOf('Error') != -1 || error) {
    console.log(error ? error : body);
    process.exit(1);
  }
  startServer();
});


const port = 26236;

function startServer() {
  const wss = new WebSocketServer({
    port: port
  });

  wss.on('connection', ws => {
    ws.on('message', data => {
      console.log(memeData);
      ws.send(JSON.stringify(memeData));
    });
  });

  startJinsMeme();
}

let memeData = {};

function startJinsMeme() {
  let memeDevice = new MemeDevice();

  memeDevice.setAppClientID(config.appClientId, config.clientSecret,
    () => {
      console.log('Authentication Success');
      memeDevice.scanAndConnect(config.macAddress);
      console.log('Start scaninng');
    }, error => {
      console.log('Error');
    }
  );

  memeDevice.on('device-discovered', (device) => {
    //console.log(device);
  });

  memeDevice.on('device-status', (arg) => {
    if(arg.status == 1){
      memeDevice.setAutoReconnect(true);
      memeDevice.startDataReport(
        data => {
          //console.log('\n---------- Data ----------');
          //console.log(data);
          memeData = {
            eyeMove: {
              up: data.eyeMoveUp,
              down: data.eyeMoveDown,
              left: data.eyeMoveLeft,
              right: data.eyeMoveRight
            },
            blink: {
              speed: data.blinkSpeed,
              strength: data.blinkStrength
            },
            gyro: {
              roll: data.roll,
              pitch: data.pitch,
              yaw: data.yaw
            },
            acc: {
              x: data.accX,
              y: data.accY,
              z: data.accZ
            },
            otherInfo: {
              walking: data.walking,
              noiseStatus: data.noizeStatus,
              fitError: data.fitError,
              powerLeft: data.powerLeft
            }
          }
        });
    }
  });
}

process.on("exit", function() {
  console.log("Exitting...")
  memeDevice.startDataReport()
  memeDevice.disconnect()
  console.log("Disconnected")
})

process.on("SIGINT", function () {
  request.delete({
    url: url,
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body: 'key='+ key
  }, function (error, response, body){
    console.log('IP Data Removing...');
    console.log(body);
    process.exit(0);
  });
})

function getLocalAddress()
{
  const interfaces = os.networkInterfaces();
  let ret = null;

  for (var dev in interfaces) {
    interfaces[dev].forEach(function(details){
      if (!details.internal){
        if (details.family === 'IPv4') {
          if (dev === 'Wi-Fi' || dev === 'イーサネット'){
            ret = details.address;
          }
        }
      }
    });
  }

  return ret;
}
