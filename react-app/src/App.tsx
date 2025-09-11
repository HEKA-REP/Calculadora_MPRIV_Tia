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
      <section className="description-section py-4" style={{ backgroundColor: '#f8f9fa' }}>
        <div className="container">
          {/* Tarjetas informativas */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="row g-3">
                <div className="col-md-4">
                  <div className="card border-0 h-100 shadow-sm" style={{ backgroundColor: '#e3f2fd' }}>
                    <div className="card-body p-3 text-center">
                      <div className="text-primary mb-2">
                        <i className="bi bi-calculator-fill fs-3"></i>
                      </div>
                      <h6 className="card-title mb-2">Cálculo Predictivo</h6>
                      <p className="card-text small text-muted">
                        Calcula sanciones económicas derivadas de infracciones a la LOPDP para Almacenes Tía
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-4">
                  <div className="card border-0 h-100 shadow-sm" style={{ backgroundColor: '#e8f5e8' }}>
                    <div className="card-body p-3 text-center">
                      <div className="text-success mb-2">
                        <i className="bi bi-graph-up-arrow fs-3"></i>
                      </div>
                      <h6 className="card-title mb-2">Evaluación de Impacto</h6>
                      <p className="card-text small text-muted">
                        Evalúa el impacto financiero potencial específico para Almacenes Tía
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-4">
                  <div className="card border-0 h-100 shadow-sm" style={{ backgroundColor: '#e1f5fe' }}>
                    <div className="card-body p-3 text-center">
                      <div className="text-warning mb-2">
                        <i className="bi bi-lightbulb-fill fs-3"></i>
                      </div>
                      <h6 className="card-title mb-2">Decisiones Informadas</h6>
                      <p className="card-text small text-muted">
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
              <div className="alert alert-info border-0 shadow-sm mb-0">
                <div className="row align-items-center">
                  <div className="col-md-1 text-center">
                    <i className="bi bi-info-circle-fill fs-2 text-info"></i>
                  </div>
                  <div className="col-md-11">
                    <h6 className="alert-heading mb-1">¿Qué es el Modelo MPRIV?</h6>
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
