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
	async client_key(){
		// Make the request
		var client_key_request = await fetch('https://api.sys32.dev/v2/key');
		
		// Read the response as text.
		return await client_key_request.text();
	}
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
		var hash_request = await fetch('https://api.sys32.dev/v2/token', hash_options);
		
		// Read the response as JSON
		return await hash_request.json();
	}
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
	async source(){
		// Make the request
		var game_request = await fetch('https://api.sys32.dev/v2/source');
		
		// Read the response as text
		return await game_request.text();
	}
};

var loader = new GameLoader();

// Observe for the WASM loader without waiting for it
// In the time it takes to finish observing, we will have the token argument and game source ready
var load_promise = loader.observe();

var token_argument = loader.token_argument();
loader.source().then(async game_code => {
	var hash = Math.random().toString();
	
	// remove '0.'
	hash = hash.slice(2);
	
	// suffix
	hash = '_' + hash;
	
	// The game will see the hash variable as a reference to this object.
	var data = {
		// A callback the game will call with the game variable
		handle_game(game){
			// { players: {...} }, [ ...Player ]
			console.log(game, game.players.list);
			
			// Finding the local player every second
			setInterval(() => {
				for(let entity of game.players.list){
					// isYTMP = isYou
					if(entity.isYTMP){
						// The local player's alias is: Guest_6
						console.log('The local player\'s alias is:', entity.alias);
						
						break;
					}
				}
			}, 1000);
		}
	};
	
	console.log('Hash generated', hash, data);
	
	console.info('Retrieved the games source, the length is', game_code.length);
	
	// Apply various patches before creating the game function
	
	// Using the Game variable patch from https://github.com/y9x/webpack/blob/master/libs/vars.js#L61
	
	game_code = game_code.replace(
		/(\w+)\.moveObj=func/,
		// Hooking when the game defines the property moveObj (which is only on the game object)
		// The game function on data is called with game as an argument.
		(match, game) => `${hash}.handle_game(${game}),${match}`
	);
	
	
	// Create the game function
	
	var game_function = new Function(hash, 'WP_fetchMMToken', game_code);
	
	// Wait for the WASM loader to be added to the document because its also when libraries such as zip.js are loaded.
	await load_promise;
	
	// The game recieves WP_fetchMMToken as a promise, we do not await for the argument when calling the game function.
	
	// Call the function using the data variable
	
	game_function(data, token_argument);
	
	console.info('Retrieved token:', await token_argument);
	
	console.info('Krunker loaded.');
});
