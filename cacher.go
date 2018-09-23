package main

import "encoding/json"
import "errors"
import "fmt"
import "os"
import "io/ioutil"
//import "nanomsg.org/go-mangos"
import "github.com/vmihailenco/msgpack"

// Variable param value
type value struct {
    Key int64
    IntV int64
    StrV string
}

// Parameter definition
type Param struct {
    Key int64 `json:"key"`
    Name string `json:"name"`
    Type string `json:"type"`
    Denominator float64 `json:"denominator"`
    Value value
}

// Config definition to map from the json
type Config struct {
    Port int `json:"cacherPort"`
    Cached []Param `json:"cached"`
}

// Global param map
var g_pm = make(map[int64]Param)

// Custom decoder
var _ msgpack.CustomEncoder = (*value)(nil)
var _ msgpack.CustomDecoder = (*value)(nil)

func (v *value) EncodeMsgpack(enc *msgpack.Encoder) error {
    // Use compact encoding
    enc = enc.UseCompactEncoding(true)
    // Encode key
    err := enc.EncodeInt(v.Key)
    if err != nil { return err }
    // Encode second value based on type
    t := g_pm[v.Key].Type
    if t == "i" {
        err = enc.EncodeInt(v.IntV)
        if err != nil { return err }
    } else if t == "s" {
        err = enc.EncodeString(v.StrV)
        if err != nil { return err }
    } else {
        return errors.New("bad type")
    }

    return nil
}

func (v *value) DecodeMsgpack(dec *msgpack.Decoder) error {
    // Get key first
    var err error
    v.Key, err = dec.DecodeInt64()
    if err != nil { return err }
    // Get type of the key
    t := g_pm[v.Key].Type
    if t == "i" {
        v.IntV, err = dec.DecodeInt64()
        if err != nil { return err }
    } else if t == "s" {
        v.StrV, err = dec.DecodeString()
        if err != nil { return err }
    } else {
        return errors.New("bad type")
    }

    return nil
}

func (mine *value) IsDiff(other *value) bool {
    if mine.Key != other.Key {
        return true
    }
    t := g_pm[mine.Key].Type
    if t == "i" {
        return mine.IntV == other.IntV
    } else if t == "s" {
        return mine.StrV == other.StrV
    } else {
        return true
    }
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

    // Construct param map
    for _, param := range config.Cached {
        param.Value.Key = param.Key
        g_pm[param.Key] = param
    }

    //
    var v value
    b, err := msgpack.Marshal(&value{Key: 100, IntV: 15})
    fmt.Println(b)
    err = msgpack.Unmarshal(b, &v)
    fmt.Println(v)
    b, err = msgpack.Marshal(&value{Key: 102, StrV: "asff"})
    fmt.Println(b)
    err = msgpack.Unmarshal(b, &v)
    fmt.Println(v)
}
