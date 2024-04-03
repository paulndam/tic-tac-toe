import "./App.css";
import { io } from "socket.io-client";
import { useEffect, useState } from "react";
import GameBoard from "./components/game-board/GameBoard";
import WelcomeModal from "./components/welcomeModal/WelcomeModal";

const socket = io("http://localhost:8080", {
  path: "/socket.io",
});

function App() {
  const [playerName, setPlayerName] = useState("");
  const [playerId, setPlayerId] = useState(null);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [gameId, setGameId] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [waitingForPlayer, setWaitingForPlayer] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showNotificationMessage, setNotificationMessage] = useState("");
  const [isPlayerOne, setIsPlayerOne] = useState(false);
  const [availableGames,setAvailableGames] = useState([]);


  const handleNameChange = (name) => {
    setPlayerName(name);
  };

  const handleStartGame = () => {
    if (playerName.trim()) {

      if(!playerId){
        socket.emit("createPlayer", {
          name: playerName.trim(),
        });
      }

      if(isPlayerOne){
        socket.emit('createGame', { playerId });
      }
      
      // setIsPlayerOne(true);
      setErrorMessage("");
    } else {
      alert("Please enter a name.");
    }
  };

  const logOut = () => {
    localStorage.removeItem("playerId");
    setPlayerId(null);
  };

  useEffect(() => {
    // When player ID or game state changes, update Local Storage
    localStorage.setItem('playerId', playerId);
    localStorage.setItem('playerName', playerName);
    localStorage.setItem('gameId', gameId);
    localStorage.setItem('isPlayerOne', isPlayerOne.toString());
}, [isPlayerOne,gameId,playerName]);


  useEffect(() => {
    const storedPlayerId = localStorage.getItem("playerId");
    const storedPlayerName = localStorage.getItem("playerName");
    const storedGameId = localStorage.getItem("gameId");
    const storedIsPlayerOne = localStorage.getItem("isPlayerOne")

    

    if (storedPlayerId && storedPlayerName) {
      setPlayerId(storedPlayerId);
      setPlayerName(storedPlayerName);
    }

    if (storedGameId) {
      setGameId(storedGameId);
      setIsPlayerOne(storedIsPlayerOne === 'true');
      // setGameStarted(true);  
      // If there is a stored game ID but no stored player ID, the player might have joined a game without registering
      if (!storedPlayerId) {
        setIsPlayerOne(false); // Ensure this user is considered as joining a game, not creating one
      }
    }

    socket.on("playerResponse", (res) => {
      console.log("response from socket ====>", res);
      if (res.newPlayer) {
        localStorage.setItem("playerId", res.newPlayer.playerId);
        localStorage.setItem("playerName", res.newPlayer.name);
        setPlayerId(res.newPlayer.playerId);
        setPlayerName(res.newPlayer.name);
        // setIsPlayerOne(true)
      }
    });

    socket.on("gameCreated", (res) => {
      console.log("response from creating game ====>", res);
      if (res.newGame) {
        localStorage.setItem("gameId", res.newGame.gameId);
        localStorage.setItem("isPlayerOne", 'true');
        setGameId(res.newGame.gameId);
        setGameStarted(true);
        setWaitingForPlayer(false);
        setIsPlayerOne(true);
      }
    });

    socket.on("allGames",(games) => {
      console.log("=== response listing all games =====>",games)
      setAvailableGames(games)
    })

    socket.on("playerCreated", (res) => {
      if(!playerId && res.newPlayer.playerId){
        setPlayerId(res.playerId);
        localStorage.setItem(res.newPlayer.playerId)
        localStorage.setItem(res.newPlayer.name)

        if(!isPlayerOne){
          socket.emit("joinGame",{gameId,playerId:res.newPlayer.playerId})
        }
      }
    })

    socket.on("gameJoined", (res) => {
      console.log("==== response joining game ======",res)
      if (!isPlayerOne) {
        localStorage.setItem("gameId", res.updateGame.gameId); // Assuming 'res' has gameId
        localStorage.setItem("isPlayerOne", 'false');
      }
      setGameStarted(true);
      setWaitingForPlayer(false);
      setNotificationMessage("Player Two has joined the game");
    });

    socket.on("gameUpdate", (game) => {
      setBoard(game.board);
      //TO DO: Handle other game updates like current turn, game status, etc.
    });

    socket.on("playerResponse", (error) => {
      if (error.type === "error") {
        setErrorMessage(error.message);
      }
    });

    socket.on("gameResponse", (error) => {
      if (error.type === "error") {
        setErrorMessage(error.message);
      }
    });

    return () => {
      socket.off("playerResponse");
      socket.off("gameCreated");
      socket.off("gameJoined");
      socket.off("gameUpdate");
    };
  }, [playerId,gameId,isPlayerOne,playerName]);

  

  const createGame = () => {
    if (playerId) {
      socket.emit("createGame", { playerId });
      setWaitingForPlayer(true);
    } else {
      setErrorMessage("You must be registered to create a game");
    }
  };

  const createPlayerAndJoinGame = () => {
    if (playerName.trim() && gameId.trim()) {
      if(!playerId){
        socket.emit("createPlayer", { name: playerName.trim() });
      }else{
        socket.emit("joinGame", {gameId,playerId });
      }
      // socket.emit("joinGame", { playerId,gameId });
      // setIsPlayerOne(false);
    } else {
      
      setErrorMessage("Please enter your name and a valid game ID to join.");
    }
  };

  const makeMove = (position) => {
    socket.emit("makeMove", { playerId, gameId, position });
  };

  return (
    <div className="App">
      {errorMessage && <div className="error-message">{errorMessage}</div>}

      {!playerId ? (
        <WelcomeModal
          playerName={playerName}
          onNameChange={handleNameChange}
          onStart={handleStartGame}
          // onStart={isPlayerOne ? handleStartGame : createPlayerAndJoinGame}
          gameId={gameId}
          setGameId={setGameId} // for updating gameId in WelcomeModal
          isPlayerOne={isPlayerOne}
          availableGames={availableGames}
        />
      ) : (
        <>
          <div className="header">
            <h1>Tic-Tac-Toe</h1>
            <h2>Welcome {playerName}</h2>
          </div>

          {waitingForPlayer && <div>Waiting for Player Two to join...</div>}

          {gameStarted && <GameBoard board={board} onMakeMove={makeMove} />}

          {gameStarted && <div>Game started! Your game ID: {gameId}</div>}

          {!gameStarted && isPlayerOne && (
            <>
              <button onClick={createGame}>Create Game</button>
              {gameId && <div>Share game ID with Player Two: {gameId}</div>}
            </>
          )}

          {!gameStarted && !isPlayerOne && (
            <>
              <input
                type="text"
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                placeholder="enter your name"
              />
              <button onClick={createPlayerAndJoinGame}>Join Game1</button>
            </>
          )}

          <button className="log-out-btn" onClick={logOut}>
            Log Out
          </button>
        </>
      )}
    </div>
  );
}

export default App;
