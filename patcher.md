# Game Patcher Tutorial
Last updated on `6/29/2021`

Adding onto the `GameLoader` class found in [loader.md](./loader.md)

You can find the result [here](./patcher.user.js), but I recommend following this tutorial.

What we will be doing:

- Creating a hash
- Using the hash as an argument when creating a `Function`, similar to WP_fetchMMToken
- Replacing parts of the game code using [RegExp](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp)

Assuming `Gameloader` is defined from loader.user.js:

1. Give the game access to a data object

The variable `hash` will be the result of `Math.random()` but with the first 2 characters `0.` removed and a suffix of `_` to make it a valid variable name.

The hash variable will be passed as the first argument to the game function and it will correspond to a store object.

The data object will contain information and functions from the game or to the game.

```js
loader.source().then(async game_code => {
	var hash = Math.random().toString();
	
	// remove '0.'
	hash = hash.slice(2);
	
	// suffix
	hash = '_' + hash;
	
	// The game will see the hash variable as a reference to this object.
	var data = {};
	
	console.log('Hash generated', hash, data);
	
	console.info('Retrieved the games source, the length is', game_code.length);
	
	// Pass the hash variable
	var game_function = new Function(hash, 'WP_fetchMMToken', game_code);
	
	// Wait for the WASM loader to be added to the document because its also when libraries such as zip.js are loaded.
	await load_promise;
	
	// The game recieves WP_fetchMMToken as a promise, we do not await for the argument when calling the game function.
	
	// Call the function using the data variable
	
	game_function(data, token_argument);
	
	console.info('Retrieved token:', await token_argument);
	
	console.info('Krunker loaded.');
});
```

2. Applying the patches.

The above code will have no difference because the game's code has nothing to do with the code.

We can make the game use the data object by applying patches.

Many RegExps can be found [here](https://github.com/y9x/webpack/blob/master/libs/vars.js) or if you choose, you can write your own by using the [game's source](https://api.sys32.dev/v2/source) as a reference.

An example of applying a RegExp patch:

```js
var gamecode = `
var private_game = {
	players: [];
};
`;

// Gamecode is executed in a scope, but we want access to the private_game variable


// Turn the code `private_game = ` into `private_game = window.exposed_game = `
// This will make the code define a property on the window, giving us access

gamecode = gamecode.replace('private_game = ', '$& window.exposed_game = ');

// var private_game = window.exposed_game = {

new Function(private_game)();

window.exposed_game // { players: [...] }
```

Now applying this to Krunker.io using an object rather than the window:

```js
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
```

You can find the result [here](./patcher.user.js).
If you have any questions, make a post on our [forum](https://forum.sys32.dev/).
