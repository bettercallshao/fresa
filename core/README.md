# Build go project with glide

## Install
For Ubuntu
    sudo apt install golang-go
    sudo apt install golang-glide

## Set up environment
    export GO15VENDOREXPERIMENT=1
    export GOPATH=$(pwd)

## Install and build with glide
    glide install
    glide build
