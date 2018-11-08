# Configure to run nodejs core

## Install
    install make / cc
    install python2
    npm install

## Run
Start

    npm start

Stop

    npm stop

Interact with cacher

    ./bin/cli cacher [0,0]

## Description
The core system has 3 services that facilitate the bare minimal features of a system. All configurations are consolidated in one config.json, and services intercommunicates via nanomsg + msgpack.

### Greeter
Listens to a UDP port, and sends the config file to whoever asks.

### Logger
Logs events to file.

### Cacher
Keeps track of a set of parameters defined in the config. Handles changes requests and publishes change notification.

## Notes
It was the original design to write this part in golang but I find golang's build system complicated to use, and may turn away new comers.
