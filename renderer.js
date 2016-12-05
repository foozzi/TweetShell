// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
window.$ = window.jQuery = require('jquery');

ipcRenderer = require('electron').ipcRenderer
handlebars = require('handlebars')

document.onreadystatechange = () => {
    if (document.readyState == "complete") {
    	ipcRenderer.send('check-auth', '');
    	ipcRenderer.once('check-auth', function(event, arg){
    		if(!arg.auth) {
    			var source   = $("#auth-button-t").html();
				var template = handlebars.compile(source);
				$('body').html(template());
    		}
    	})
    	$(document).ready(function(){
    		$('#twitter-auth').click(function(){
	    		ipcRenderer.send('show-login-window', '');
	    		ipcRenderer.once('show-login-window', function(event, arg){
	    			console.log($("#tweet-t").html())
	    			var source   = $("#tweet-t").html();
					var template = handlebars.compile(source);
					$('body').html(template());
	    		});
	    	})
    	})
	}
}
