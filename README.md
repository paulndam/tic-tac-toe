## Tic-Tac-Toe Web Application

This project is a web-based Tic-Tac-Toe game that allows two players to compete against each other. The game state is persisted on the server, and at the end of each game, results are saved and used to update player rankings.

## System Architecture

Frontend: Built with React, provides the user interface for game interaction.
Backend: Node.js server that handles game logic, player sessions, and API requests.
Database: PostgreSQL used to store game states, results, and player rankings.

## Technologies Used

React.js
Node.js
gRPC
PostgreSQL
HTML/CSS
Web Sockets (Optional for real-time updates)

## Features

Creation of a new game board.
Connection of exactly two players to a game.
Persistence of game state on the server.
Implementation of standard Tic-Tac-Toe rules.
Display of game result and updating of player rankings in the database.
Display of the top five players.
Ability for players to start a new game.

## Development Environment Setup

Install Node.js and npm.
Install PostgreSQL and create a database for the project.
Clone the repository to your local machine.
Navigate to the project directory and install dependencies:

**\*** npm install **\*\*\***

Set up environment variables for database connections and other configurations.

env variables to use are below:

## Running the Application

start the backend server

**\*** npm start **\*\*\***

In a separate terminal, start the React frontend:

**\*** npm start **\*\*\***


## API Documentation

Endpoints for game creation, player connections, and game state updates are documented in the `api.md` file located in the project root.

## How to Play

Navigate to the main page and click "Start New Game."
Share the game link with another player to join.
Take turns clicking on the grid to place your X or O.
The game ends when one player wins or all squares are filled (draw).
View updated rankings on the main page.

## Project Structure
frontend/: React application files.
backend/: Server-side application files including game logic and API.
proto/: Definitions for gRPC services.
db/: Database schema and migration files.