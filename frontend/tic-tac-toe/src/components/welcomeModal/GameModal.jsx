import React from "react";
import "./styles.css";

const GameModal = ({
  playerName,
  onNameChange,
  onStart,
  isPlayerOne,
  gameId,
  setGameId,
  onJoinGame,
}) => {
  const handleAction = () => {
    if(isPlayerOne){
      onStart()
    }else{
      onJoinGame()
    }
  }
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
          <div>
            <input
              type="text"
              value={gameId || ""}
              onChange={(e) => setGameId(e.target.value)}
              placeholder="Enter Game ID to Join"
            />
          </div>
        )}
        <button onClick={handleAction}>
          {isPlayerOne ? "Start New Game" : "Join Game"}
        </button>

        
      </div>
    </div>
  );
};

export default GameModal;
