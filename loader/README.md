# Game Loader Tutorial

> Last updated on `1/16/2021`
> 
> Functional as of `1/16/2021`

I will update this time to time if the matchmaker token generation changes.

You can find the result [here](./loader.v3.pretty.user.js), but I recommend following this tutorial.

Information about the api.sys32.dev endpoints can be found [here](../api/v3.md).

## Prerequisites

- Enable instant inject in Tampermonkey. This is because the game's preload script (in the document head) detects Tampermonkey's late loading.

1. Go to Tampermonkey Dashboard
2. Click on settings
3. Change Config mode to Advanced
4. Scroll to the bottom of the dashboard and find "Experimental". Change Inject Mode to Instant

#### Making a game loader requires the following:
- Removing the WASM loader
- Fetching the latest source
- Generating a matchmaker token
- Loading the game source with the matchmaker token

1. Basic userscript layout.

Create a [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) userscript with headers that matches Krunker.

For this tutorial we will be using a class called GameLoader which contains our functions.

```js
// ==UserScript==
// @name           Krunker Loader
// @author         The Gaming Gurus
// @description    A simple loader for Krunker
// @version        1.0
// @license        gpl-3.0
// @namespace      https://y9x.gitub.io/resources/
// @match          *://krunker.io/*
// @run-at         document-start
// @noframes
// ==/UserScript==

'use strict';

class GameLoader {
	observe(){
	
	}
	async client_key(){
	
	}
	async matchmaker_token(client_key){
	
	}
	async hash_token(token){
	
	}
	async token_argument(){
	
	}
	async source(){
	
	}
};

var loader = new GameLoader();
```

2. Observe the document for when the script containing the WASM loader is added.

The function will return a promise that is resolved when the WASM loader is cancelled and libaries such as zip.js are loaded.

```js
observe(){
	return new Promise(resolve => {
		var observer = new MutationObserver((mutations, observer) => {
			for(let mutation of mutations){
				for(let node of mutation.addedNodes){
					if(node.tagName == 'SCRIPT' && node.textContent.includes('Yendis Entertainment')){
						console.info('Got the WASM loader script:', node);
						
						// Clear the script's textContent to prevent loading.
						node.textContent = '';
						
						console.info('WASM loader removed');
						
						// Resolve the promise to indicate the game is ready to load.
						resolve();
						
						// The observer no longer needs to check for new elements because the WASM loading has been stopped.
						observer.disconnect();
					}
				}
			}
		});

		observer.observe(document, {
			childList: true,
			subtree: true,
		});
	});
}
```

```
var loader = new GameLoader();

var load_promise = loader.observe();

```

3. Generate a matchmaker token.

Inspecting network requests to Krunker, the first request made is to https://matchmaker.krunker.io/generate-token which has the Client-Key header attached.

The API at api.sys32.dev will provide us with the Client-Key header by fetching https://api.sys32.dev/v3/key

```js
async client_key(){
	// Make the request
	var client_key_request = await fetch('https://api.sys32.dev/v3/key');
	
	// Read the response as text.
	return await client_key_request.text();
}
```

We will then make a request to https://matchmaker.krunker.io/generate-token with this Client-Key.

```js
async matchmaker_token(client_key){
	// Attach the header.
	var hash_options = {
		headers: new Headers(),
	};
	
	hash_options.headers.set('Client-Key', client_key);
	
	// Make the request
	var token_request = await fetch('https://matchmaker.krunker.io/generate-token', hash_options);
	
	// Read the response as JSON.
	return await token_request.json();
}
```

The result of calling matchmaker_token is not hashed therefore other matchmaker endpoints such as seek-game, will not accept this token.

The API at api.sys32.dev will generate a hashed token from this response which can be used for other matchmaker endpoints.

```js
async hash_token(token){
	// This endpoint requires the token as input so we will make a POST request.
	var hash_options = {
		method: 'POST',
		headers: new Headers(),
	};

	// Set the Content-Type to application/json otherwise the server will not accept JSON input
	hash_options.headers.set('Content-Type', 'application/json');
	
	// Turn the object into a string appropiate for the fetch body
	hash_options.body = JSON.stringify(token);
	
	// Make the request
	var hash_request = await fetch('https://api.sys32.dev/v3/token', hash_options);
	
	// Read the response as JSON
	return await hash_request.json();
}
```

Now that we have the functions to generate a hashed token, we will add another that will retrieve the Client-Key, make a request to the matchmaker, and generate a hashed token.

```js
async token_argument(){
	// Retrieve the Client-Key header.
	var client_key = await this.client_key();
	
	console.info('Retrieved Client-Key:', client_key);
	
	// Retrieve the matchmaker token
	var token = await this.matchmaker_token(client_key);
	
	console.info('Retrieved token:', token);
	
	// Generate a hashed token
	return await this.hash_token(token);
}
```

4. Loading the game source with the matchmaker token.

The API endpoint https://api.sys32.dev/v3/source.pretty provides the latest Krunker source. We will fetch this URL and read it as text.
>  https://api.sys32.dev/v3/source.pretty will return a beautified source (easy to read, newlines), if you want the minified source then change this URL to https://api.sys32.dev/v3/source


```js
async source(){
	// Make the request
	var game_request = await fetch('https://api.sys32.dev/v3/source.pretty');
	
	// Read the response as text
	return await game_request.text();
}
```


When the WASM loads the game, code similar to this is executed:
```js
new Function('WP_fetchMMToken',GAME_SOURCE)(MATCHMAKER_TOKEN)
```

With the game code, we will create a function with this code along with the argument `WP_fetchMMToken` which corresponds to the hashed token.

```js
loader.source().then(async game => {
	console.info('Retrieved the games source, the length is', game.length);
	
	var game_function = new Function('WP_fetchMMToken', game);
});
```

We will also need to wait for the observer to indicate the game is ready to load. Once loaded, we will call the newly created `game_function` with the Promisie `token_argument`.

```js
var load_promise = loader.observe();

var token_argument = loader.token_argument();

loader.source().then(async game => {
	console.info('Retrieved the games source, the length is', game.length);
	
	var game_function = new Function('WP_fetchMMToken', game);
	
	// Wait for the WASM loader to be added to the document because its also when libraries such as zip.js are loaded.
	await load_promise;
	
	// The game recieves WP_fetchMMToken as a promise, we do not await for the argument when calling the game function.
	game_function(token_argument);
	
	console.info('Retrieved token:', await token_argument);
	
	console.info('Krunker loaded.');
});
```

You can find the result [here](./loader.v3.pretty.user.js).

Comparing this custom loader to the WASM loader:
- There is no lag spike during the page load
- Loading time is under 100 MS

This is not a guide on how to make cheats but it is possible with enough knowledge. With the games source and the ability to load it from a variable, you can make modifications and patches to the game or even extract data.

### Using Krunker's matchmaker

For accessing https://matchmaker.krunker.io/seek-game , you need the `validationToken` query.

The `validationToken` is created from the token argument resolve value, it is array of UTF8 bytes.

```js
var loader = new GameLoader();

var token_argument = loader.token_argument();

token_argument.then(token => {
	// token is a array, String.fromCharCode accepts multiple number arguments and returns a string.
	var validationToken = String.fromCharCode(...token);
	
	console.log('Created validation token:', validationToken);
	
	// fetch('https://matchmaker.krunker.io/seek-game?
});
```

If you have any questions, make a post on our [forum](https://forum.sys32.dev/).
