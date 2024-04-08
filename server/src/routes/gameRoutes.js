import express from "express"
import { joinGameHandler, makeMoveHandler, postGame } from "../controllers/gameController.js";


const app = express.Router();

app.post("/game", postGame)

app.post("/game/:gameId/join",joinGameHandler)

app.post("/game/:gameId/move", makeMoveHandler)


export default app;