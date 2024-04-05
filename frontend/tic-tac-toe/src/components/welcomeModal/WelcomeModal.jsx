import React from "react";
import "./styles.css";

const WelcomeModal = ({
  playerName,
  onNameChange,
  onStart,
  isPlayerOne,
  gameId,
  setGameId,
  onJoinGame,
}) => {
  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Welcome to the Ultimate Tic-Tac-Toe Challenge</h2>
        <input
          type="text"
          placeholder="Enter your name to play"
          value={playerName || ""}
          onChange={(e) => onNameChange(e.target.value)}
        />
        {!isPlayerOne && (
          <>
            <input
              type="text"
              value={gameId || ""}
              onChange={(e) => setGameId(e.target.value)}
              placeholder="Enter Game ID to Join"
            />
          </>
        )}
        <button onClick={onStart}>
          {isPlayerOne ? "Start New Game" : "Register"}
        </button>

        {gameId && <button onClick={onJoinGame}>Join Game</button>}
      </div>
    </div>
  );
};

export default WelcomeModal;
