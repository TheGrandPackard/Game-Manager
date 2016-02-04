var fs = require('fs');

module.exports = {

  verify: function(config) {
	  
	// TODO: Verify the configuration data
	return true;  
  },
	
  start: function (config) {
	console.log("Starting Factorio Installer");
	
	var buffer = new Buffer('{"instance_name":"' 	+ config.instance_name + '",' +	
							 '"updater_username":"' + config.updater_username + '",' +	
							 '"updater_password":"' + config.updater_password + '",' +
							 '"autosave_slots":"'   + config.autosave_slots + '",' +
							 '"autosave_interval":"'+ config.autosave_interval + '",' +
							 '"latency":"'          + config.latency + '",' +
							 '"port":"'          	+ config.port + '",' +
							 '"experimental":"'     + config.experimental + '",' +
							 '"headless":"'         + config.headless + '"}');
	  
	// 1. Save the server configuration file to disk	  
	fs.open('servers/factorio.json', 'w', function(err, fd) {
	  fs.write(fd, buffer, 0, buffer.length, null, function(err) {
		if (err) throw 'error writing file: ' + err;
		  fs.close(fd, function() {
			  
			// 2. Download the game server from Factorio website
			console.log("Config File Written. Downloading Game.");
			// 3. Install the game server
			console.log("Game Installed.");
			// 4. Deploy the init scripts
			console.log("Deploying Init Scripts.");
			
			// WebSocket to keep user updated as the server installs from the dashboard
			// Need Server heirarchy to support multiple instances --> Add server port to input form
		})
	  });
	});
  }
};