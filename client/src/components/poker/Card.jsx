import React from 'react';

export const Card = ({ card, hidden, className = '' }) => {
  // If no card data provided (e.g. placeholder), render empty slot
  if (!card && !hidden) {
      return (
        <div className={`w-14 h-20 md:w-16 md:h-24 rounded-md border-2 border-white/10 bg-white/5 mx-1 flex items-center justify-center ${className}`} />
      );
  }

  // Parse card string "As", "Th", "2c" etc if string
  let displayValue, suit;
  if (typeof card === 'string') {
      displayValue = card.slice(0, -1);
      suit = card.slice(-1).toUpperCase(); // H, D, C, S
      // Map suit to symbol
  } else if (card) {
      // Assuming object { v, s }
      displayValue = card.v;
      suit = card.s;
  }

  // Handle 10 as T
  if (displayValue === 'T') displayValue = '10';

  return (
    <div className={`
      w-14 h-20 md:w-16 md:h-24 rounded-md border shadow-lg mx-1 flex items-center justify-center text-xl font-bold relative transition-transform hover:-translate-y-2 cursor-default
      ${hidden ? 'bg-red-900 border-white/10' : 'bg-white text-black border-white'}
      ${className}
    `}>
      {hidden ? (
        <div className="w-full h-full bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-red-800 to-black rounded-sm border border-white/10" />
      ) : (
        <>
          <span className={`absolute top-1 left-1 text-xs md:text-sm ${['H','D'].includes(suit) ? 'text-red-500' : 'text-black'}`}>
            {displayValue}
          </span>
          <span className={`text-2xl md:text-3xl ${['H','D'].includes(suit) ? 'text-red-500' : 'text-black'}`}>
            {suit === 'H' ? '♥' : suit === 'D' ? '♦' : suit === 'C' ? '♣' : '♠'}
          </span>
          <span className={`absolute bottom-1 right-1 rotate-180 text-xs md:text-sm ${['H','D'].includes(suit) ? 'text-red-500' : 'text-black'}`}>
            {displayValue}
          </span>
        </>
      )}
    </div>
  );
};
