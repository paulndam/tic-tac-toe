const ShowRegisterAndStartOrJoinGameButton = ({onStart,onJoin}) => {
    return (
        <div className="modal">
          <div className="modal-content">
            <h2>Welcome to the Ultimate Tic-Tac-Toe Challenge</h2>
            <button onClick={onStart}>Start Game</button>
            <button onClick={onJoin}>Join Game</button>
          </div>
        </div>
      );
};

export default ShowRegisterAndStartOrJoinGameButton;
