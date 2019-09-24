# MNC.Tool

Simple Electron based tool to analyze Fanuc Mnemonic (.mnc) files.

## Prerequisities

- NodeJS ([get it here](https://nodejs.org/en/download/))

## Installation

1. Clone
2. bash run `npm install`
3. bash run `npm start`


## How to build

1. bash run `npm update`
2. bash run `npm run dist`


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

**Out-of-date**
Level | Module | Description
---|---|---
1|`core.js`|Contains main mnemonic analyzing sequence
2|`resources.js`|Contains classes and class-specific methods for each type of evaluated data
3|`query.js`|Contains the query-class and class-specific methods. Used to query `Resource` Objects
4|`interface.js`|Contains functions to interface with the `mainWindow_index.html` DOM. (GUI functions)
X|`renderer.js`|Not used - required by electron


### A general Overview on how to build an electron application

1. Make sure you've got a `build` folder in your projects root dir.
2. Add a `background.png` and `icon.ico` file (`background.dmg` & `icon.icns` for Mac)
*(The ico File must be at least 2565x256 pixels)*
3. Add `electron-builder` to your dev app dependencies by running:

    ```
    npm install electron-builder --save-dev
    ```

4. Update your `package.json` file:
*(Make sure you get a valid category for your build-mac-category property. Get them from
  https://developer.apple.com/library/archive/documentation/General/Reference/InfoPlistKeyReference/Articles/LaunchServicesKeys.html#//apple_ref/doc/uid/TP40009250-SW8)*

    ```
    {
      "name": "yourappname",
      "version": "0.0.1",
      "description": "your app description",
      "author": "xyz <xyz@gmail.com>",

      ...

      "scripts": {
        "pack": "electron-builder --dir",
        "dist": "electron-builder"
      },

      ...

      "build": {
        "mac": {
          "appId": "MANDELBROT.Tool",
          "category": "public.app-category.utilities"
        },
        "linux": {
          "target": [
            "AppImage",
            "deb"
          ]
        },
        "win": {
          "target": "NSIS",
          "icon": "build/icon.ico"
        }
      }
    }
    ```

5. Build installer by running
`npm run dist`
