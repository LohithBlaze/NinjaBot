# NinjaBot

Created a chatbot that will receive queries for building test builds, updating the salesforce and contacting confluence servers to get wiki information on a query.

The bot is built with Microservice architecture, where each server is running in the nginx server and main bot will query for the approriate commands.

To run this bot, 

type node bin/run.js

Create a slack bot and get a token to communicate with the slack client. 

use wit.ai token to communicate with the wit.ai

place all the token in the .env file so that the process can get the tokens. 
