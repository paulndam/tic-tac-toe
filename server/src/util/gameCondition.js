export const checkWinCondition = (board) => {

    // determines all win condition in a tic-tac-toe;
    const winConditions = [
        [0,1,2], [3,4,5], [6,7,8], // rows
        [0,3,6], [1,4,7], [2,5,8], // columns
        [0,4,8], [2,4,6]           // diagonals
    ]

    // check for any win conditions.
    for(let condition of winConditions){
        if(board[condition[0]] && board[condition[0]] === board[condition[1]] && board[condition[0]] === board[condition[2]]){
            return board[condition[0]]; // will return 'X' or 'O'
        }
    }

    // check for a draw.
    if(board.every(position => position === 'X' || position === 'O')){
        return 'Draw'
    }

    // no win or draw
    return null
}