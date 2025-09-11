import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="site-footer mt-auto">
      <div className="container">
        <div className="d-flex justify-content-between align-items-center footer-row">
          <div className="footer-col">
            <img src="/assets/logo_heka_footer.png" alt="Logo Heka" style={{ height: '70px' }} />
          </div>
          <div className="footer-col text-center d-flex justify-content-center align-items-center" style={{ flex: 1 }}>
            <p className="mb-0">© 2025 Todos los derechos reservados</p>
          </div>
          <div className="footer-col text-end">
            <a href="mailto:serviciospdp@heka.com.ec">serviciospdp@heka.com.ec</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;