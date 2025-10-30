
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="mt-16 py-8 bg-gray-950 text-center border-t-2 border-amber-500/30">
      <div className="container mx-auto px-4">
        <p className="text-gray-400">
          ¿Listo para darle una nueva vida a tu estudio?
        </p>
        <a 
          href="mailto:contacto@calligraffiti.com" 
          className="mt-2 inline-block text-amber-400 font-semibold hover:text-amber-300 transition-colors"
        >
          Contáctanos para una cotización
        </a>
        <p className="mt-6 text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Calligraffiti Ink Studios. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
