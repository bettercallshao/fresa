# C# library / UI for fresa

Library is yet to complete. UI can select device and interact with parameters.

## Files
Library

    ./FresaClient

UI

    ./Gui

## Troubleshooting
The nanomsg dependency requires the C lib, and it may not be able to find it (e.g. on my Ubuntu 18.04), in which case, I solved it by

    sudo ln -s /usr/lib/x86_64-linux-gnu/libnanomsg.so /usr/lib/

## TODO
* Complete FresaClient
* Unit test
* Put lib on NuGet
