import "./App.css";
import { io } from "socket.io-client";
import { useEffect, useState } from "react";
import GameBoard from "./components/game-board/GameBoard";
import WelcomeModal from "./components/welcomeModal/WelcomeModal";
import { GameStatus } from "./components/utils/gameStatus";

const socket = io("http://localhost:8080", {
  path: "/socket.io",
});

function App() {
  const [playerName, setPlayerName] = useState("");
  const [playerId, setPlayerId] = useState(null);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [gameId, setGameId] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [waitingForPlayer, setWaitingForPlayer] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showNotificationMessage, setNotificationMessage] = useState("");
  const [isPlayerOne, setIsPlayerOne] = useState(false);
  const [isPlayerTwo, setIsPlayerTwo] = useState(false);
  const [availableGames, setAvailableGames] = useState([]);
  const [sessionID, setSessionID] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // New loading state


  

  const updateGameStateFromResponse = (response) => {
    // Consolidated game state update logic
    setPlayerId(response.playerId);
    setPlayerName(response.playerName);
    setGameId(response.gameId);
    setBoard(response.board);
    setIsPlayerOne(response.isPlayerOne);
    setGameStarted(response.gameStarted);
    setIsPlayerTwo(response.isPlayerTwo);
    // Additional updates as necessary...
  };

  const handleStartGame = () => {
    if (!playerName.trim()) {
      alert("Please enter a name.");
      return;
    }
    if (!playerId) {
      setIsPlayerOne(true);
      console.log("Creating Player...");
      socket.emit("createPlayer", { name: playerName.trim() });
      setWaitingForPlayer(true);
    }
  };

  const handleJoinGameOrRegister = () => {
    if (!playerName.trim() || (gameId && !gameId.trim())) {
      alert("Please enter a name and, if joining a game, a valid game ID.");
      return;
    }

    if (!playerId) {
      console.log(
        gameId ? "Joining Game as Player Two..." : "Creating Player and Game..."
      );

      socket.emit(
        "createPlayer",
        {
          name: playerName.trim(),
          gameId: gameId || undefined,
        }

      );
    }
  };

  const handleNameChange = (newName) => {
    setPlayerName(newName);
  };

  const handleGameIdChange = (newGameId) => {
    setGameId(newGameId);
  };

  // useEffect(() => {
  //   const storedGameId = localStorage.getItem("gameId");
  //   const storedIsPlayerOne = localStorage.getItem("isPlayerOne") === "true";
  //   const storedGameStarted = localStorage.getItem("gameStarted") === "true";

  //   if (storedGameId) {
  //     socket.emit("requestGameState", { gameId: storedGameId });
  //   } else {
  //     setGameStarted(storedGameStarted && storedIsPlayerOne);
  //   }
  // }, []);

  // useEffect(() => {
  //   const storedPlayerId = localStorage.getItem("playerId");
  //   const storedGameId = localStorage.getItem("gameId");

  //   // Only set isPlayerOne or gameStarted based on explicit server validation
  //   if (storedGameId && storedPlayerId) {
  //     // Request current game state from the server to validate
  //     socket.emit("requestGameState", { gameId: storedGameId });
  //   }
  // }, []);

  

  useEffect(() => {
    const storedPlayerId = localStorage.getItem("playerId");
    const storedPlayerName = localStorage.getItem("playerName");
    const storedGameId = localStorage.getItem("gameId");
    const storedIsPlayerOne = localStorage.getItem("isPlayerOne");
    const storedGameStarted = localStorage.getItem("gameStarted");
    const savedBoard = localStorage.getItem("board");

    if (savedBoard) {
      setBoard(JSON.parse(savedBoard));
    }

    if (storedPlayerId && storedPlayerName) {
      setPlayerId(storedPlayerId);
      setPlayerName(storedPlayerName);
      setIsPlayerTwo(!isPlayerOne);
    }

    if (storedGameId) {
      setGameId(storedGameId);
      setIsPlayerOne(storedIsPlayerOne === "true");
      // if (!storedPlayerId) {
      //   setIsPlayerOne(false);
      // }
      setGameStarted(storedGameStarted === "true" || storedIsPlayerOne === "true");

    }

    // if(storedGameId){
    //   console.log("Requesting game state for gameId:", storedGameId);

    //   socket.emit("requestGameState",{gameId:storedGameId})
    // }

    const handlePlayerResponse = (res) => {
      console.log("response from creating player ===>", res);
      if (res.sessionID) {
        // Store the session ID in sessionStorage
        sessionStorage.setItem("sessionID", res.sessionID);
        setSessionID(res.sessionID);
      }
      if (res.type === "playerCreated") {
        const { playerId, name } = res.player;
        localStorage.setItem("playerId", playerId);
        localStorage.setItem("playerName", name);

        setPlayerId(playerId);
        setPlayerName(name);
        setIsPlayerTwo(false);
      } else if (res.type === "joinedGame") {
        const { game, playerTwo } = res;
        localStorage.setItem("gameId", game.gameId);
        localStorage.setItem("playerId", playerTwo.id);
        setGameId(game.gameId);
        setGameStarted(true);
        setIsPlayerTwo(true);
        setWaitingForPlayer(false);
        setNotificationMessage(
          `Joined game successfully. Your game ID: ${game.gameId}. Waiting for the game to start.`
        );
      }
    };

    const handleGameResponse = (res) => {
      console.log("response from creating game ===>", res);
      if (res.newGame) {
        const { gameId } = res.newGame;
        localStorage.setItem("gameId", gameId);
        localStorage.setItem("isPlayerOne", "true");
        setGameId(gameId);
        setGameStarted(true);
        setIsPlayerOne(true);
        setWaitingForPlayer(true);
      }
    };

    const handleGameJoinedResponse = (response) => {
      console.log("Game join response:====>", response);
      if (response.type === "gameJoined") {
        // Success, a player has joined the game
        const { updateGame, playerTwo } = response;
        localStorage.setItem("gameId", gameId);
        setGameId(gameId);
        setGameStarted(true);
        setWaitingForPlayer(false);
        setNotificationMessage(
          `Player ${playerTwo.name} has joined your game. The game has started!`
        );
      } else if (response.type === "error") {
        setErrorMessage(response.message);
      }
    };

    const handleGameStateResponse = (response) => {
      if (response.type === "gameState") {
        const isCurrentPlayerOne = response.playerOneId === playerId;
        const isCurrentPlayerTwo = response.playerTwoId === playerId;

        setGameStarted(response.status !== GameStatus.Finished);
        setIsPlayerOne(isCurrentPlayerOne);
        setIsPlayerTwo(isCurrentPlayerTwo);

        if (isCurrentPlayerTwo) {
          setWaitingForPlayer(false);
        }
      } else if (response.type === "error") {
      }
    };

    const handleGameResetResponse = (response) => {
      console.log("Game reset response:==>", response);
      if (response.type === "gameReset") {
        setBoard(Array(9).fill(null)); // Reset the board state
        setGameStarted(false);
        setWaitingForPlayer(false);
        console.log("Game has been reset");
      }
    };

    // Register socket event listeners
    socket.on("playerResponse", handlePlayerResponse);
    socket.on("gameResponse", handleGameResponse);
    socket.on("gameJoinedResponse", handleGameJoinedResponse);
    socket.on("gameResetResponse", handleGameResetResponse);
    socket.on("gameStateResponse", handleGameStateResponse);

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
      socket.off("playerResponse", handlePlayerResponse);
      socket.off("gameResponse", handleGameResponse);
      socket.off("gameJoinedResponse", handleGameJoinedResponse);
      socket.off("gameResetResponse", handleGameResetResponse); // Fixed typo here
      socket.off("gameStateResponse", handleGameStateResponse);
    };
  }, [isPlayerOne, playerId, gameId]);


  useEffect(() => {
    const session = sessionStorage.getItem("sessionID");
    console.log("session ======>", session);
  
    if (session) {
      // Emit the validateSession event and handle the response through a callback
      socket.emit("validateSession", { sessionID: session }, (response) => {
        console.log("session response =======>", response);
        if (response.valid) {
          updateGameStateFromResponse(response);
        } else {
          sessionStorage.removeItem("sessionID");
        }
        setIsLoading(false); // Update loading state regardless of validation result
      });
    } else {
      setIsLoading(false); // No session ID, not loading
    }
  }, [socket]); // Ensure socket is in the dependency array if it's stateful
  

  useEffect(() => {
    if (isPlayerOne && !gameId) {
      console.log(
        "Player is Player One and no gameId exists, creating game..."
      );
      socket.emit("createGame", { playerId: playerId });
    }
  }, [isPlayerOne, gameId, playerId]);

  useEffect(() => {
    localStorage.setItem("board", JSON.stringify(board));
  }, [board]);

  const makeMove = (position) => {
    socket.emit("makeMove", { playerId, gameId, position });
  };

  const handleResetGame = () => {
    if (!gameId) {
      console.log("No game to reset");
      return;
    }
    socket.emit("resetGame", { gameId });

    setBoard(Array(9).fill(null));
    setGameStarted(false);
    setWaitingForPlayer(false);
  };

  const logOut = () => {
    localStorage.removeItem("playerId");
    localStorage.removeItem("gameId");
    localStorage.removeItem("playerName");

    // player leave game
    socket.emit("leaveGame", { playerId, gameId });

    setPlayerId(null);
    setPlayerName("");
    setGameStarted(false);
    setIsPlayerOne(false);
    setIsPlayerTwo(false);
    setGameId("");
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {showNotificationMessage && (
        <div className="notification-message">{showNotificationMessage}</div>
      )}

      {!gameStarted ? (
        <WelcomeModal
          playerName={playerName}
          onNameChange={handleNameChange}
          onStart={handleStartGame}
          gameId={gameId}
          setGameId={handleGameIdChange}
          isPlayerOne={isPlayerOne}
          onJoinGame={handleJoinGameOrRegister}
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
          <button className="reset-game-btn" onClick={handleResetGame}>
            Reset Game
          </button>

          <button className="log-out-btn" onClick={logOut}>
            Log Out
          </button>
        </>
      )}
    </div>
  );
}

export default App;
