package main

import (
    "errors"
    "fmt"
    "github.com/vmihailenco/msgpack"
    "nanomsg.org/go-mangos/protocol/rep"
    "nanomsg.org/go-mangos/transport/tcp"
    "strconv"

    "config"
)

// Map element for parameter
type Param struct {
    Def config.ParamDef
    Value ParamValue
}

// Custom decoder
var _ msgpack.CustomEncoder = (*ParamValue)(nil)
var _ msgpack.CustomDecoder = (*ParamValue)(nil)

func (v *ParamValue) EncodeMsgpack(enc *msgpack.Encoder) error {

    // Use compact encoding
    enc = enc.UseCompactEncoding(true)

    // Encode key
    if err := enc.EncodeInt(v.Key); err != nil { return err }

    // Encode second value based on type
    t := g_pm[v.Key].Def.TypeChar()
    fmt.Println(t)
    switch t {
    case 'i':
        return enc.EncodeInt(v.IntV)
    case 's':
        return enc.EncodeString(v.StrV)
    case 'b':
        return enc.EncodeBool(v.BoolV)
    default:
        return errors.New("bad type")
    }
}

func (v *ParamValue) DecodeMsgpack(dec *msgpack.Decoder) error {

    // Get key first
    var err error
    if v.Key, err = dec.DecodeInt64(); err != nil { return err }

    // Get type of the key
    t := g_pm[v.Key].Def.TypeChar()
    switch t {
    case 'i':
        v.IntV, err = dec.DecodeInt64()
    case 's':
        v.StrV, err = dec.DecodeString()
    case 'b':
        v.BoolV, err = dec.DecodeBool()
    default:
        err = errors.New("bad type")
    }

    return err
}

func (mine *ParamValue) IsDiff(other *ParamValue) bool {

    if mine.Key != other.Key {
        return true
    }

    t := g_pm[mine.Key].Def.TypeChar()
    switch t {
    case 'i':
        return mine.IntV == other.IntV
    case 's':
        return mine.StrV == other.StrV
    case 'b':
        return mine.BoolV == other.BoolV
    default:
        // Strange type is always different
        return true
    }
}

// Variable param value
type ParamValue struct {
    Key int64
    IntV int64
    StrV string
    BoolV bool
}

// Global param map
var g_pm = make(map[int64]*Param)

func InitParamMap(cfg config.Config) {

    for _, pd := range cfg.Cached {
        g_pm[pd.Key] = &Param{pd, ParamValue{}}
    }

}

func Serve(cfg config.Config) {

    // Get a socket
    sock, err := rep.NewSocket()
    if err != nil { panic(err) }
    sock.AddTransport(tcp.NewTransport())

    // Set url
    if err := sock.Listen("tcp://localhost:" + strconv.Itoa(cfg.CacherCmdPort)); err != nil { panic(err) }

    // Serve loop
    for {
        // Get full message
        msg, err := sock.Recv()

        // Decode message
        v := ParamValue{}
        if err = msgpack.Unmarshal(msg, &v); err != nil { panic(err) }

        // Modify state
        if (&v).IsDiff(&g_pm[v.Key].Value) {
            g_pm[v.Key].Value = v
        }

        // Reply with nothing, this op can't fail
        sock.Send([]byte{})
    }

}

func main() {

    cfg, err := config.Load()
    if err != nil { panic(err) }

    InitParamMap(cfg)

    Serve(cfg)

    /*
    var v ParamValue
    b, _ := msgpack.Marshal(&ParamValue{Key: 100, IntV: 15})
    fmt.Println(b)
    msgpack.Unmarshal(b, &v)
    fmt.Println(v)
    b, _ = msgpack.Marshal(&ParamValue{Key: 102, StrV: "asff"})
    fmt.Println(b)
    msgpack.Unmarshal(b, &v)
    fmt.Println(v)
    */
}
