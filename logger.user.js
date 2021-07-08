// ==UserScript==
// @name         Krunker Packet Logger
// @namespace    https://forum.sys32.dev/
// @icon         https://y9x.github.io/webpack/libs/gg.gif
// @version      1.0
// @match        https://krunker.io/*
// @match        https://*.browserfps.com/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/msgpack-lite/0.1.26/msgpack.min.js
// @run-at       document-start
// @grant        unsafeWindow
// @noframes
// ==/UserScript==

var [ incoming_log, outgoing_log ] = eval(`//# sourceURL=\u200b\n[(...a)=>console.info('%c <= ','background:#FF6A19;color:#000',...a),(...a)=>console.debug('%c => ','background:#7F7;color:#000',...a)]`),
	only_log_packets = true,
	msgpack = window.msgpack;

if(only_log_packets)for(let [ prop, value ] of Object.entries(console)){
	if(typeof value == 'function'){
		unsafeWindow[prop] = () => {};
	}
}

class HookedWebSocket extends WebSocket {
	process_incoming(label, data){
		switch(label){
			default:
				incoming_log([ label, ...data ]);
				
				break;
		}
	}
	process_outgoing(label, data){
		switch(label){
			default:
				
				outgoing_log([ label, ...data ]);
				
				break;
		}
	}
	constructor(...args){
		super(...args);
		
		console.info('Outgoing packets will be shown in the `info` tab');
		console.debug('Incoming packets will be shown in the `verbose` tab');
		
		
		this.addEventListener('message', ({ data: packet }) => {
			var [ label, ...data ] = msgpack.decode(new Uint8Array(packet));
			
			this.process_incoming(label, data);
			
			packet.data = msgpack.encode([ label, data ]);
		});
		
		console.clear();
		
		console.log('WebSocket hooked');
	}
	send(packet){
		var padding = 2,
			signature = packet.slice(-padding),
			[ label, ...data ] = msgpack.decode(packet.slice(0, -padding));
		
		this.process_outgoing(label, data);
		
		return super.send(Uint8Array.from([ ...msgpack.encode([ label, ...data ]), ...signature ]).buffer);
	}
};

unsafeWindow.WebSocket = HookedWebSocket;
