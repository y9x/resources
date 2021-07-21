# Endpoints for https://api.sys32.dev/

## Generate the `Client-Key` header

| Method | Endpoint  |
| - | - |
| `GET` | [/v2/key](https://api.sys32.dev/v2/key) |

Response:

```txt
118,108,84,117,52,87,50,104,115,51,116,112,107,114,80,72,55,54,114,73,83,66,109,84,113,66,90,78,68,84,108,118,117,103,113,99,48,110,89,54,82,70,49,69,97,56,70,82,109,87,49,108,120,56,53,67,109,119,110,109,48,85,111,97
```

## Hash the matchmaker's token

Post body parameters are derived from the client's request to [https://matchmaker.krunker.io/generate-token](https://matchmaker.krunker.io/generate-token). The response is a JSON array of UTF-8 bytes that can be efficiently read as a string by running `String.fromCharCode(...bytes)`.

| Method | Endpoint  |
| - | - |
| `POST` | [/v2/key](https://api.sys32.dev/v2/token) |

Post body:

| Parameter | Type      | Description  |
| --------- | --------- | ------------ |
| cfid      | `Integer` | Session ID   |
| sid       | `Integer` | Salt ID      |
| token     | `String`  | Raw token    |

Response: 

```json
[76,65,74,73,76,106,106,98,103,97,73,99,89,78,50,65,117,48,100,73,50,122,107,82,67,90,69,114,84,67,55,102,102,107,73,118,98,111,66,83,86,52,114,113,73,81,67,104,89,65,89,82,78,118,118,108,113,71,75,117,79,117,121,121]
```

## Retrieve Krunker's source

Returns Krunker's source ran through [Terser](https://github.com/terser/terser).

| Method | Endpoint  |
| - | - |
| `GET` | [/v2/source](https://api.sys32.dev/v2/source) |

Query:

| Parameter | Type      | Description  |
| --------- | --------- | ------------ |
| raw       | `*`       | If specified, the original source that includes all the bloat added by [Javascript-Obfuscator](https://www.npmjs.com/package/javascript-obfuscator) as part of Krunker's webpack configuration will be returned |

Response:

```js
if(typeof createPrivateRoom=='function'){let a='Multiple instances of Krunker.IO running';console.trace(a);throw alert(a+', try disabling duplicate userscripts')}//# sourceURL=Krunker.e575H.js
!function(e){var t,i=(
```

`?raw`

```js

!function(iiïîiíí){var iîiïiìî=function(){var iíîïiiì=!![];return function(iìïiïíì,iíiîïìí){
```

## Retrieve a checksum of Krunker's source

Returns a JSON object containing the MD5 checksum of the source from /v2/source.

| Method | Endpoint  |
| - | - |
| `GET` | [/v2/source/checksum](https://api.sys32.dev/v2/source/checksum) |

Query:

| Parameter | Type      | Description  |
| --------- | --------- | ------------ |
| raw       | `*`       | If specified, the original source's checksum will be returned |

Response:

```json
{
	"md5":"639222ff65cb008fae5cfd774538058f"
}
```
