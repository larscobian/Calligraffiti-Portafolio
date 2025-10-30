
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="py-16 bg-gray-900 text-center border-b-2 border-amber-500/30">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Calligraffiti Ink Studios
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg sm:text-xl text-gray-400">
          Transformamos tu estudio de tatuajes con arte mural único y profesional.
          Explora nuestras referencias e inspírate.
        </p>
      </div>
    </header>
  );
};

export default Header;
