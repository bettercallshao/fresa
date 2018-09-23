package main

import "encoding/json"
import "fmt"
import "os"
import "io/ioutil"
import "github.com/op/go-nanomsg"

type Single struct {
    Key int `json:"key"`
    Name string `json:"name"`
    Type string `json:"type"`
    Denominator float64 `json:"denominator"`
}

type Config struct {
    Port int `json:"cacherPort"`
    Cached []Single `json:"cached"`
}

func main() {

    // Read the file
    body, err := ioutil.ReadFile("config.json")
    if err != nil {
        dir, _ := os.Getwd()
        fmt.Println("Working under " + dir + ", no config.json found.")
        panic(err)
    }

    // Decode JSON
    config := Config{}
    json.Unmarshal(body, &config)

    // Print
    fmt.Println(config.Cached[0].Key)
}

