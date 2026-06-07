import type { DashboardStats, PageView } from '../types/app'

type HomeViewProps = {
  dashboard: DashboardStats
  onNavigate: (view: PageView) => void
}

export function HomeView({ dashboard, onNavigate }: HomeViewProps) {
  return (
    <section className="page-section home-section">
      <div className="page-heading">
        <div>
          <h2>Inicio</h2>
          <p>Acesse rapidamente os servicos mais usados da central academica.</p>
        </div>
      </div>
      <div className="home-grid">
        <article 
          className="home-card" 
          onClick={() => onNavigate('rides')} 
          style={{ cursor: 'pointer' }}
        >
          <h3>Caronas para hoje</h3>
          <strong>{dashboard.ridesCount} rotas ativas</strong>
          <p>Confira pontos de encontro em Curitiba e reserve sua vaga.</p>
        </article>
        
        <article 
          className="home-card" 
          onClick={() => onNavigate('lostFound')} 
          style={{ cursor: 'pointer' }}
        >
          <h3>Achados e perdidos</h3>
          <strong>{dashboard.lostItemsCount} itens registrados</strong>
          <p>Veja rapidamente o que foi encontrado no campus nas ultimas 48h.</p>
        </article>
        
        <article 
          className="home-card" 
          onClick={() => onNavigate('mural')} 
          style={{ cursor: 'pointer' }}
        >
          <h3>Mural academico</h3>
          <strong>{dashboard.muralCount} publicacoes visiveis</strong>
          <p>Eventos, vagas e comunicados oficiais publicados pela comunidade.</p>
        </article>
      </div>
    </section>
  )
}