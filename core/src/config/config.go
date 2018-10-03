package config

import (
    "encoding/json"
    "errors"
    "io/ioutil"
    "os"
)

// Parameter definition
type ParamDef struct {
    Key int64 `json:"key"`
    Name string `json:"name"`
    Type string `json:"type"`
    Denominator float64 `json:"denominator"`
}

// Config definition to map from the json
type Config struct {
    CacherCmdPort int `json:"cacherCmdPort"`
    CacherDatPort int `json:"cacherDatPort"`
    Cached []ParamDef `json:"cached"`
}

// Load config from file
func Load() (Config, error) {

    cfg := Config{}
    fname := "config.json"

    // Read the file
    body, err := ioutil.ReadFile(fname)
    if err != nil {
        dir, _ := os.Getwd()
        return cfg, errors.New("Cannot access " + fname + " under " + dir)
    }

    // Decode JSON
    err = json.Unmarshal(body, &cfg)
    if err != nil {
        return cfg, errors.New("Cannot decode JSON")
    }

    return cfg, err
}

// Convenience to get type as char
func (pd ParamDef) TypeChar() byte {
    // take first char of string
    if pd.Type == "" { return 0 } else { return pd.Type[0] }
}
