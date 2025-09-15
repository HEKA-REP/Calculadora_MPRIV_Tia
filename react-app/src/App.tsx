import React from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import MPRIVCalculator from './components/MPRIVCalculator';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="App d-flex flex-column min-vh-100">
      <Header />
      
      {/* Descripción de la página */}
      <section className="description-section py-4" style={{ backgroundColor: '#fefbfb' }}>
        <div className="container">
          {/* Tarjetas informativas */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="row g-4">
                <div className="col-md-4">
                  <div className="card h-100 shadow" 
                       style={{ 
                         backgroundColor: '#fff5f5', 
                         border: '1px solid #dc2626',
                         transition: 'all 0.3s ease',
                         borderRadius: '14px'
                       }}
                       onMouseOver={(e) => {
                         e.currentTarget.style.transform = 'translateY(-5px)';
                         e.currentTarget.style.boxShadow = '0 10px 28px rgba(220, 38, 38, 0.20)';
                       }}
                       onMouseOut={(e) => {
                         e.currentTarget.style.transform = 'translateY(0)';
                         e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                       }}>
                    <div className="card-body p-4 text-center">
                      <div className="mb-3" style={{ color: '#dc2626' }}>
                        <div style={{
                          width: '60px',
                          height: '60px',
                          backgroundColor: 'rgba(220, 38, 38, 0.1)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto',
                          border: '2px solid #dc2626'
                        }}>
                          <i className="bi bi-calculator-fill fs-3"></i>
                        </div>
                      </div>
                      <h6 className="card-title mb-3 fw-bold" style={{ color: '#7f1d1d' }}>Cálculo Predictivo</h6>
                      <p className="card-text small" style={{ color: '#6b7280', lineHeight: '1.6' }}>
                        Calcula sanciones económicas derivadas de infracciones a la LOPDP para Almacenes Tía
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-4">
                  <div className="card h-100 shadow" 
                       style={{ 
                         backgroundColor: '#fff6ef', 
                         border: '1px solid #ff6b35',
                         transition: 'all 0.3s ease',
                         borderRadius: '14px'
                       }}
                       onMouseOver={(e) => {
                         e.currentTarget.style.transform = 'translateY(-5px)';
                         e.currentTarget.style.boxShadow = '0 10px 28px rgba(255, 107, 53, 0.20)';
                       }}
                       onMouseOut={(e) => {
                         e.currentTarget.style.transform = 'translateY(0)';
                         e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                       }}>
                    <div className="card-body p-4 text-center">
                      <div className="mb-3" style={{ color: '#ff6b35' }}>
                        <div style={{
                          width: '60px',
                          height: '60px',
                          backgroundColor: 'rgba(255, 107, 53, 0.08)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto',
                          border: '2px solid #ff6b35'
                        }}>
                          <i className="bi bi-graph-up-arrow fs-3"></i>
                        </div>
                      </div>
                      <h6 className="card-title mb-3 fw-bold" style={{ color: '#c2410c' }}>Evaluación de Impacto</h6>
                      <p className="card-text small" style={{ color: '#6b7280', lineHeight: '1.6' }}>
                        Evalúa el impacto financiero potencial específico para Almacenes Tía
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-4">
                  <div className="card h-100 shadow" 
                       style={{ 
                         backgroundColor: '#fffae9', 
                         border: '1px solid #fbbf24',
                         transition: 'all 0.3s ease',
                         borderRadius: '14px'
                       }}
                       onMouseOver={(e) => {
                         e.currentTarget.style.transform = 'translateY(-5px)';
                         e.currentTarget.style.boxShadow = '0 10px 28px rgba(251, 191, 36, 0.20)';
                       }}
                       onMouseOut={(e) => {
                         e.currentTarget.style.transform = 'translateY(0)';
                         e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                       }}>
                    <div className="card-body p-4 text-center">
                      <div className="mb-3" style={{ color: '#fbbf24' }}>
                        <div style={{
                          width: '60px',
                          height: '60px',
                          backgroundColor: 'rgba(251, 191, 36, 0.1)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto',
                          border: '2px solid #fbbf24'
                        }}>
                          <i className="bi bi-lightbulb-fill fs-3"></i>
                        </div>
                      </div>
                      <h6 className="card-title mb-3 fw-bold" style={{ color: '#92400e' }}>Decisiones Informadas</h6>
                      <p className="card-text small" style={{ color: '#6b7280', lineHeight: '1.6' }}>
                        Permite a Almacenes Tía tomar decisiones informadas para el cumplimiento normativo
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sección de información adicional */}
          <div className="row mb-1">
            <div className="col-12">
              <div className="alert shadow-sm mb-0" style={{ backgroundColor: '#fef2f2', borderLeft: '4px solid #dc2626', border: '1px solid #f8d5d5', borderRadius: '14px' }}>
                <div className="row align-items-center">
                  <div className="col-md-1 text-center">
                    <i className="bi bi-info-circle-fill fs-2" style={{ color: '#dc2626' }}></i>
                  </div>
                  <div className="col-md-11">
                    <h6 className="alert-heading mb-1" style={{ color: '#7f1d1d' }}>¿Qué es el Modelo MPRIV?</h6>
                    <p className="mb-0 small">
                      Es una herramienta de cálculo basada en la Ley Orgánica de Protección de Datos Personales del Ecuador, 
                      que permite a Almacenes Tía estimar las sanciones económicas por infracciones a la normativa de protección de datos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <main className="flex-grow-1">
        <MPRIVCalculator />
      </main>
      <Footer />
    </div>
  );
};

export default App;
