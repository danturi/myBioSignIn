cordova.define("org.apache.cordova.plugin.SpenPlugin.SpenPlugin", function(
		require, exports, module) {
	var SpenPlugin = function() {
		cordova.exec.setNativeToJsBridgeMode(cordova.exec.nativeToJsModes.PRIVATE_API);
	};
	
		SpenPlugin.prototype.addEvents = function() {
			cordova.exec(function(param) {
			}, function(error) {
				alert("Unable to initialize pen support: " + error);
			}, "SpenPlugin", "penEvents", []);
		}
	
	module.exports = new SpenPlugin();

});
