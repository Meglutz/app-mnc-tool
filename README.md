# MNC.Tool

Simple Electron based tool to analyze Fanuc Mnemonic (.mnc) files.

## Prerequisities

- NodeJS ([get it here](https://nodejs.org/en/download/))

## Installation

1. Clone
2. bash run `npm install`
3. bash run `npm start`

## Heads up

Decompiled MNCs need to be converted to UTF-8 first!
The FANUC ladder tool will convert MNCs to USC-2 LE BOM when choosing `UNICODE` encoding.
The easiest method so far is to open the MNC in NotePad++ and select `Encoding > UTF-8` then
save the file as such.
