<img src="https://qph.fs.quoracdn.net/main-qimg-b41d6005b5a333ac09f135e4773a7e7a.webp" width="100">

## Fresa
Concise template for buliding UI / hardware interactions

## Stack
| Thing | Decision |
| --- | --- |
| Backend Platform | Linux |
| Frontend Platform | Linux / Windows / Web |
| Backend Language | Python / C / NodeJS / Go / Java |
| Frontend Framework | Qt / C# / Web |
| Communication | nanomsg + msgpack |

## Provides
* Generic logging
* Configuration
* Highlevel network interface (no need to write socket programs)
* Highlevel protocol interface (no need to write parsers)
* Flexible microservice + message queue topology (enabling your team to write in the language they like)
* Easy to write simulation (important for hardware projects)

## Rationale
In my previous workplace, lots of project require building a UI + Hardware interaction system for prototyping. I am trying to consolidate my knowledge (and avoiding the mistakes I have made) to provide people with similar objectives a kick start. Another reason is developers for embedded software are generally behind on the software stack generally because of either their background, the familar tools chip manufacturers provde or systemetic bureaucracy, I aim to give them a excuse to try new things.

## How this helps you
If you are a embedded software developer (e.g. with a PIC32) and you have written a C program (driver) that talks to the hardware via serial. Then the client wants to control it from her Windows laptop, and you have to figure something out. Fresa helps in these ways:
* Plug in your driver as a service, and decouple it from the UI and other business logic
* Ask your teammates to write the business logic in their launguage (lots of people only know NodeJS)
* Convert your firmware to use msgpack and use a reliable parser instead of your own invention
* Sample UIs with the message plumbing already done

## FAQ
* When is it arriving?

    I aim to have a beta by end of November, 2018.

## How to run
* Run core services. Refer to ./core
* Test with one of the UIs. Refer to ./node-front ./node-back ./csharp
