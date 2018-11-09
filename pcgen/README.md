# Configure to run Python core

## Install
For Ubuntu
    sudo apt install libnanomsg-dev python3-pip
    pip3 install pipenv

## Set up environment
    export PIPENV_VENV_IN_PROJECT=1

## Install and build with glide
    pipenv install

## Run
Start

    pipenv run python cli.py Start

Stop

    pipenv run python cli.py Stop

Interact with cacher

    pipenv run python cli.py CacherSend "[0, 0]"

Interact with watcher

    pipenv run python cli.py CacherSend 0

Interact with greeter

    pipenv run python cli.py Greeter

Interact with logger

    pipenv run python cli.py LoggerSend cli 1 "sample log"

Consult help

    pipenv run python cli.py --help

## Description
The core system has 4 services that facilitate the bare minimal features of a system. All configurations are consolidated in one config.json, and services intercommunicates via nanomsg + msgpack.

### Greeter
Listens to a UDP port, and sends the config file to whoever asks.

### Logger
Logs events to file.

### Cacher
Keeps track of a set of parameters defined in the config. Handles changes requests and publishes change notification.

### Watcher
Keeps track of which services (core or not) are online.

## Notes
It was the original design to write this part in golang but I find golang's build system complicated to use, and may turn away new comers.
