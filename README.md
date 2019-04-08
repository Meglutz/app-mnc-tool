# MNC.Tool

Simple Electron tool to analyze Fannuc Mnemonic (.mnc) files.


## Installation
1. Clone
2. run `npm install`
3. run `npm start`

## Heads up
Decompiled MNCs need to be converted to UTF-8 first!
The FANUC ladder tool will convert MNCs to USC-2 LE BOM when choosing `UNICODE`
Easiest method so far is to open the MNC in N++ and select `Encoding > UTF-8` then
save the file as such.
