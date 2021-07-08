Endpoints for api.sys32.dev

# v2

## Matchmaking:

### `GET /key`

Returns the `client-key` header for making requests to https://matchmaker.krunker.io/generate-token

### `POST /token`

Request body is the JSON response from https://matchmaker.krunker.io/generate-token

Returns the result of hashing the request body.

## Source:

###  `GET /source`

Krunker's raw source ran through [Terser](https://github.com/terser/terser)

### `GET /source/checksum`

JSON checksum data for `/source`

```json
{
	"md5": "..."
}
```

###  `GET /source/raw`

Krunker's raw source

### `GET /source/raw/checksum`

JSON checksum data for `/source/raw`

```json
{
	"md5": "..."
}
```
