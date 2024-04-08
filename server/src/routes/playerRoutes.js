import express from "express"
import { getAllPlayers, getPlayer, postPlayer } from "../controllers/playerController.js";

const app = express.Router()


app.post("/players",postPlayer)

app.get("/players", getAllPlayers)

app.get("/players/:playerId",getPlayer)

export default app;