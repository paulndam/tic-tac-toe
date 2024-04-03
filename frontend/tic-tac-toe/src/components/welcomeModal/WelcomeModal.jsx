import React from "react";
import "./styles.css";

const WelcomeModal = ({
  playerName,
  onNameChange,
  onStart,
  isPlayerOne,
  gameId,
  setGameId,
  availableGames,
}) => {
  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Welcome to the Ultimate Tic-Tac-Toe Challenge</h2>
        <input
          type="text"
          placeholder="Enter your name to play"
          value={playerName}
          onChange={(e) => onNameChange(e.target.value)}
        />
        {!isPlayerOne && (
          <>
            <input
              type="text"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              placeholder="Enter Game ID to Join"
            />
            {
                availableGames.length > 0 && (
                    <div>
                        <h3>Current Games</h3>
                        {
                            availableGames.map((game,i)=>(
                                <div key={game.id} onClick={() => setGameId(gameId)}>Game : {game.id}</div>
                            ))
                        }
                    </div>
                )
            }
          </>
        )}
        <button onClick={onStart}>{isPlayerOne ? "Start New Game" : "Start Playing"}</button>

      </div>
    </div>
  );
};

export default WelcomeModal;
