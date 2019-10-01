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


### A general Overview on how to build an electron application

1. Make sure you've got a `build` folder in your projects root dir.
2. Add a `background.png` and `icon.ico` file (`background.dmg` & `icon.icns` for Mac)
*(The ico File must be at least 256 x 256 pixels)*
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
