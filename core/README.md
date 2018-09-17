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
    pipenv run cacher.py
    ...
