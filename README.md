# log-collector-project
The project provides a web service for users to be able to query a specific log file in the specific directory (like /var/log/ and etc.), and get last n events of specified file in be reverse order. The customer interface is a HTTP REST request.

The project includes two web services located in the separated directories:
    . log-gateway    (external API service)
    . log-collect-service  (internal API service)

The service log-gateway provides the external APIs that users use to get log messages displayed. It runs on the master server and is responsible to route the user API requests to log-collect-service running on the different servers. Users can only access this server for log collection.

The service log-collect-service is an internal service. It runs on different servers to query the log file located in their own file system
and retrieve log events based on some filters like the last number of events and basic text/keyword.

In order to run this project, npm and nodejs need to be installed in the server.

Setup and Run log-gateway:
	. go to the directory /log-gateway
	. run “npm install” if first time 
	. run “npm start” or “node gateway.js” to start gateway service

Setup and run log-collect-service:
    . go to the directory / log-collect-service
	. run “npm install” if first time 
	. run “npm start [port#]” or “node logCollect.js [port#]” to start log-collect-service. The parameter “[port#]” is optional and 3000 by default.

