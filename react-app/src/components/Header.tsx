import React from 'react';

const Header: React.FC = () => {
  return (
    <nav className="navbar navbar-light bg-white shadow-sm sticky-top position-relative">
      <div className="container position-relative">
        <div className="navbar-brand">
          <img src="/assets/logo_heka.png" alt="Logo Heka" style={{ height: '32px' }} />
        </div>
        <h2 className="position-absolute top-50 start-50 translate-middle text-uppercase fw-bold mb-0">
          CALCULADORA DE MULTAS
        </h2>
        <div className="ms-auto">
              <img src="/assets/logo_tia.png" alt="Logo Almacenes Tía" style={{ height: '45px' }} />
        </div>
      </div>
    </nav>
  );
};

export default Header;
