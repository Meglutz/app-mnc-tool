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

## Dev Overview / App Structure

Quick overview on how this app is structured:

- `main.js` creates the electron Obj and passes the `mainWindow_index.html` file into the main window. `mainWindow_index.html` is the only
html file (aka. view or window) for this application.

- `mainWindow_index.html` is styled by the cascading stylesheets in `/styles`

- `mainWindow_index.html` includes all jscripts from the `/scripts` folder.

The following table explains the roles of each jscript in the `/scripts` folder. All the app logic is contained within these files.

Level | Module | Description
---|---|---
1|`core.js`|Contains main mnemonic analyzing sequence
2|`resources.js`|Contains classes and class-specific methods for each type of evaluated data
3|`query.js`|Contains the query-class and class-specific methods. Used to query `Resource` Objects
4|`interface.js`|Contains functions to interface with the `mainWindow_index.html` DOM. (GUI functions)
X|`renderer.js`|Not used - required by electron
