import "./App.css";
import { io } from "socket.io-client";
import { useCallback, useEffect, useState } from "react";
import GameBoard from "./components/game-board/GameBoard";
import ShowRegisterAndStartOrJoinGameButton from "./components/start-or-join-game/StartOrJoinGame";
import GameModal from "./components/welcomeModal/GameModal";
import { GameStatus } from "./components/utils/gameStatus";
import WinRecordsTable from "./components/win-record-table/WinRecordTable";

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
  const [sessionID, setSessionID] = useState(null);
  const [gameSessionId, setGameSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showStartGameModal, setShowStartGameModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [myTurn, setMyTurn] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [winnerMessage, setWinnerMessage] = useState("");
  const [winRecords, setWinRecords] = useState([]);

  const handleShowModalType = (type) => {
    setModalType(type);
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

  const handleJoinGame = async () => {
    if (!playerName.trim() || !gameId.trim()) {
      alert("Please enter your name and gameId before joining a game.");
      return;
    }

    if (!playerId) {
      socket.emit("createPlayer", { name: playerName.trim() });

      socket.once("playerResponse", (response) => {
        if (response.type === "playerCreated") {
          localStorage.setItem("playerId", response.newPlayer.playerId);
          setPlayerId(response.newPlayer.playerId);
          joinGame(gameId, response.newPlayer.playerId);
        } else {
          setErrorMessage("Failed to create player.");
        }
      });
    } else {
      joinGame(gameId, playerId);
    }
  };

  const joinGame = (gameId, playerId) => {
    if (!gameId) {
      alert("Game ID is required to join a game.");
      return;
    }
    socket.emit("joinGame", {
      gameId: gameId,
      playerId: playerId,
      sessionID: localStorage.getItem("sessionID"),
    });
    setIsPlayerOne(false);
    setIsPlayerTwo(true);
    setGameId(gameId);
  };

  const handleNameChange = (newName) => {
    setPlayerName(newName);
  };

  const handleGameIdChange = (newGameId) => {
    setGameId(newGameId);
  };

  const makeMove = (position) => {
    if (myTurn && board[position] === null) {
      socket.emit("makeMove", { playerId, gameId, position });
    } else {
      setNotificationMessage(`Cell position already taken.`);
    }
  };

  const handleRestartGame = useCallback(() => {
    if (gameId) {
      socket.emit("restartGame", { gameId });
    } else {
      throw new Error("No game found to restart");
    }
  }, [gameId]);

  useEffect(() => {
    const storedPlayerId = localStorage.getItem("playerId");
    const storedPlayerName = localStorage.getItem("playerName");
    const storedGameId = localStorage.getItem("gameId");
    const storedIsPlayerOne = localStorage.getItem("isPlayerOne");
    const storedGameStarted = localStorage.getItem("gameStarted");
    const savedBoard = localStorage.getItem("board");
    const storedSessionId = localStorage.getItem("sessionID");
    const storedTurn = JSON.parse(localStorage.getItem("myTurn"));

    if (storedTurn !== null) {
      setMyTurn(storedTurn);
    }

    if (savedBoard && savedBoard !== "undefined") {
      try {
        const boardArray = JSON.parse(savedBoard);
        setBoard(boardArray);
      } catch (error) {
        setBoard(Array(9).fill(null));
      }
    } else {
      setBoard(Array(9).fill(null));
    }

    if (storedPlayerId && storedPlayerName) {
      setPlayerId(storedPlayerId);
      setPlayerName(storedPlayerName);
      setIsPlayerTwo(!isPlayerOne);
    }

    if (storedGameId && storedSessionId) {
      setGameId(storedGameId);
      setIsPlayerOne(storedIsPlayerOne === "true");

      setGameStarted(
        storedGameStarted === "true" || storedIsPlayerOne === "true"
      );
      setSessionID(storedSessionId);
    }

    const handlePlayerResponse = (res) => {
      if (res.sessionID) {
        localStorage.setItem("sessionID", res.sessionID);
        setSessionID(res.sessionID);
      }
      if (res.type === "playerCreated") {
        const { playerId, name } = res.newPlayer;
        localStorage.setItem("playerId", playerId);
        localStorage.setItem("playerName", name);

        setPlayerId(playerId);
        setPlayerName(name);
        setIsPlayerTwo(false);

        if (playerId && isPlayerOne && !gameId) {
          socket.emit("createGame", { playerId });
          setMyTurn(true);
          localStorage.setItem("myTurn", JSON.stringify(true));
        }
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
        setTimeout(() => setNotificationMessage(""), 15000);
      }
    };

    const handleGameResponse = (res) => {
      if (res.newGame && res.gameSessionId) {
        localStorage.setItem("gameSessionID", res.gameSessionId);
        setGameSessionId(res.gameSessionId);
        localStorage.setItem("gameId", res.newGame.gameId);
        localStorage.setItem("isPlayerOne", "true");
        setGameId(res.newGame.gameId);
        setGameStarted(GameStatus.In_Progress);
        setIsPlayerOne(true);
        setWaitingForPlayer(true);
      }
      if (res.type === "gameRestarted") {
        handleRestartGame();
      }
    };

    const handleJoinedGameResponse = (response) => {
      if (response.type === "gameJoined") {
        const { playerTwo } = response;
        localStorage.setItem("gameId", gameId);
        setGameId(response.updateGame.gameId);
        setPlayerId(playerTwo.playerId);
        setIsPlayerTwo(true);
        setPlayerName(playerTwo.name);
        setGameStarted(true);
        setGameStarted(GameStatus.In_Progress);
        setWaitingForPlayer(false);
        setNotificationMessage(
          `Player ${playerTwo.name} has joined game. The game has started! ✅✅✅✅`
        );
      } else if (response.type === "error") {
        setErrorMessage(response.message);
      }
    };

    const handleMakeMoveResponse = (response) => {
      if (response.type === "moveMade") {
        setBoard(JSON.parse(response.gameStatus.board));

        const isMyTurn = response.gameStatus.currentTurn === playerId;

        setMyTurn(isMyTurn);

        localStorage.setItem("myTurn", JSON.stringify(isMyTurn));

        if (!isMyTurn) {
          setNotificationMessage("Waiting for the other player...");
        }
      } else if (response.type === "error") {
        setErrorMessage(response.message);
      }
    };

    const handleGameStateResponse = (response) => {
      if (response.type === "gameState") {
        localStorage.setItem("gameSessionID", response.gameId);

        const parsedBoard =
          typeof response.board === "string"
            ? JSON.parse(response.board)
            : response.board;

        localStorage.setItem("board", JSON.stringify(parsedBoard));

        const isCurrentPlayerOne = response.playerOne;
        const isCurrentPlayerTwo = response.playerTwo;

        setGameStarted(true);
        setGameId(response.gameId);
        setIsPlayerOne(isCurrentPlayerOne);
        setIsPlayerTwo(isCurrentPlayerTwo);
        setBoard(parsedBoard);

        if (isCurrentPlayerTwo) {
          setWaitingForPlayer(false);
        }
      } else if (response.type === "error") {
        throw Error(response.error);
      }
    };

    const handleGameOver = (response) => {
      console.log("handle game over response ======>", response);

      if (response.type === "gameOver") {
        setGameOver(true);
        setWinnerMessage(response.message);
      }

      if (response.status === GameStatus.Finished) {
        socket.emit("winningRecords");
      }
    };

    const handleGameRestarted = (response) => {
      console.log("data for game restarted ======>", response);
      if (response.type === "gameRestarted") {
        setGameOver(false);
        setWinnerMessage("");
        setNotificationMessage("The game has restarted. Good luck!");
        setBoard(Array(9).fill(null));
        setGameStarted(true);
        setGameId(response.newGameId);
      }
    };

    const handleShowWinRecords = (response) => {
      console.log("win record response ====>",response)
      if (response.type === "winRecords") {
        const { records } = response;
        setWinRecords(records);
      }
    };

    socket.on("playerResponse", handlePlayerResponse);
    socket.on("gameResponse", handleGameResponse);
    socket.on("gameJoinedResponse", handleJoinedGameResponse);
    socket.on("gameMoveResponse", handleMakeMoveResponse);
    socket.on("gameStateResponse", handleGameStateResponse);
    socket.on("gameOver", handleGameOver);
    socket.on("winningRecordsResponse", handleShowWinRecords);
    socket.on("gameRestartedResponse", handleGameRestarted);

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
      socket.off("gameJoinedResponse", handleJoinedGameResponse);
      socket.off("gameMoveResponse", handleMakeMoveResponse);
      socket.off("gameRestarted", handleGameRestarted);
      socket.off("gameStateResponse", handleGameStateResponse);
      socket.off("winningRecordsResponse", handleShowWinRecords);
    };
  }, [isPlayerOne, playerId, gameId, handleRestartGame]);

  // RE-ESTABLISH CONNECTION AND GAME STATE
  useEffect(() => {
    const storedSessionId = localStorage.getItem("sessionID");

    const storedGameId = localStorage.getItem("gameId");

    const storedIsPlayerOne = localStorage.getItem("isPlayerOne") === "true";
    const storedGameStarted = localStorage.getItem("gameStarted") === "true";

    if (storedGameId && storedSessionId) {
      socket.emit("requestGameState", {
        gameId: storedGameId,
        sessionID: storedSessionId,
      });
    } else {
      setGameStarted(storedGameStarted && storedIsPlayerOne);
    }
  }, []);

  useEffect(() => {
    const storedSessionId = localStorage.getItem("sessionID");

    const storedPlayerId = localStorage.getItem("playerId");
    const storedGameId = localStorage.getItem("gameId");

    if (storedGameId && storedPlayerId && storedSessionId) {
      // Request current game state from the server to validate
      socket.emit("requestGameState", {
        gameId: storedGameId,
        sessionID: storedSessionId,
      });
    }
  }, []);

  useEffect(() => {
    const session = localStorage.getItem("sessionID");

    if (session) {
      socket.emit("validateSession", { sessionID: session }, (response) => {
        if (response.valid) {
          updateGameStateFromResponse(response);
        } else {
          if (response.hasOwnProperty("valid")) {
            localStorage.removeItem("sessionID");
          }
        }
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("board", JSON.stringify(board));
  }, [board]);

  const updateGameStateFromResponse = (response) => {
    setPlayerId(response.playerId);
    setPlayerName(response.playerName);
    setGameId(response.gameId);
    setBoard(response.board);
    setIsPlayerOne(response.isPlayerOne);
    setGameStarted(response.gameStarted);
    setIsPlayerTwo(response.isPlayerTwo);
  };

  const logOut = () => {
    localStorage.removeItem("playerId");
    localStorage.removeItem("gameId");
    localStorage.removeItem("playerName");
    localStorage.removeItem("sessionID");
    localStorage.removeItem("gameSessionID");

    socket.emit("leaveGame", { playerId, gameId });

    setPlayerId(null);
    setPlayerName("");
    setGameStarted(false);
    setIsPlayerOne(false);
    setIsPlayerTwo(false);
    setGameId("");
  };

  const handleResetGame = () => {
    if (gameId) {
      setBoard(Array(9).fill(null));
    }
  };

  if (isLoading) {
    return <div className="loader">Loading...</div>;
  }

  return (
    <div className="App">
      {errorMessage && <div className="error-message">{errorMessage}</div>}

      {showNotificationMessage && (
        <div className="notification-message">{showNotificationMessage}</div>
      )}

      {!gameStarted && !modalType && (
        <ShowRegisterAndStartOrJoinGameButton
          onStart={() => handleShowModalType("start")}
          onJoin={() => handleShowModalType("join")}
        />
      )}

      {!gameStarted && modalType === "start" && (
        <GameModal
          playerName={playerName}
          onNameChange={handleNameChange}
          onStart={handleStartGame}
          isPlayerOne={true}
        />
      )}

      {!gameStarted && modalType === "join" && (
        <GameModal
          playerName={playerName}
          onNameChange={handleNameChange}
          onJoinGame={handleJoinGame}
          gameId={gameId}
          setGameId={handleGameIdChange}
          isPlayerOne={false}
        />
      )}

      {gameStarted && (
        <div>
          <div className="game-header">
            <h1>Tic-Tac-Toe</h1>
            <div
              className={`player-info ${
                isPlayerOne ? "player-one" : "player-two"
              }`}
            >
              <h2>Welcome, {playerName}</h2>
            </div>
          </div>

          <div className={`turn-info ${myTurn ? "" : "waiting-for-turn"}`}>
            {myTurn ? (
              <p>
                <span className="player-name">{playerName}</span> It's your turn
                to make a move!
              </p>
            ) : (
              <p>
                Waiting for <span className="player-name">{playerName}</span> to
                make a move...
              </p>
            )}
          </div>

          {waitingForPlayer ? (
            <div className="waiting">
              <div className="waiting-message">
                Waiting for Player Two to join...
              </div>
            </div>
          ) : (
            <GameBoard board={board} onMakeMove={makeMove} />
          )}
          {gameStarted && (
            <div>
              The game is about to start! You can share the game ID: {gameId}
            </div>
          )}

          {gameOver && (
            <div className="winner-notification">
              <div className="winner-message">
                <h3>Game Over</h3>
                <p>{winnerMessage}</p>
                <button onClick={handleRestartGame}>Start New Game</button>
                <WinRecordsTable winRecords={winRecords} />
              </div>
            </div>
          )}

          <button className="reset-game-btn" onClick={handleResetGame}>
            Reset Game
          </button>

          <button className="log-out-btn" onClick={logOut}>
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
