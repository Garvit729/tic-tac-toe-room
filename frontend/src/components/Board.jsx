import React from 'react';

const Board = ({ board, onCellClick, disabled, mySymbol, currentTurn, userId }) => {
  const isMyTurn = currentTurn === userId;

    const getCellClass = (index, value) => {
    let baseClass = "w-24 h-24 text-4xl font-bold rounded-lg transition-all duration-200 ";
    
    if (value === 'X') {
      baseClass += "bg-blue-500 text-white shadow-lg animate-[scale-in_0.2s_ease-out]";
    } else if (value === 'O') {
      baseClass += "bg-red-500 text-white shadow-lg animate-[scale-in_0.2s_ease-out]";
    } else if (!disabled && isMyTurn) {
      baseClass += "bg-white/20 hover:bg-white/30 hover:scale-105 cursor-pointer border-2 border-white/30";
    } else {
      baseClass += "bg-white/10 cursor-not-allowed border-2 border-white/20";
    }

    return baseClass;
  };


  const handleClick = (index) => {
    if (!disabled && board[index] === '' && isMyTurn) {
      onCellClick(index);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-3 p-4 bg-white/5 rounded-xl backdrop-blur-sm">
      {board.map((cell, index) => (
        <button
          key={index}
          className={getCellClass(index, cell)}
          onClick={() => handleClick(index)}
          disabled={disabled || cell !== '' || !isMyTurn}
        >
          {cell}
        </button>
      ))}
    </div>
  );
};

export default Board;
