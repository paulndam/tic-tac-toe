import React from "react";
import "./style.css";

const GameBoard = ({ board, onMakeMove }) => {
  return (
    <div className="container">
        <div className="game-board">
        {board.map((cell, index) => (
            <div key={index} className="cell" onClick={() => onMakeMove(index)}>
            {cell}
            </div>
        ))}
        </div>
    </div>
  );
};

export default GameBoard;
