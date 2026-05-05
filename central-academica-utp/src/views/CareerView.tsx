import type { CareerProfile, CareerProfileSetter } from '../types/app'

type CareerViewProps = {
  careerProfile: CareerProfile
  isSaving: boolean
  onCareerChange: CareerProfileSetter
  onSave: () => void
}

export function CareerView({
  careerProfile,
  isSaving,
  onCareerChange,
  onSave,
}: CareerViewProps) {
  return (
    <section className="page-section career-section">
      <div className="page-heading">
        <div>
          <h2>Perfil Profissional</h2>
          <p>Cadastre seu curriculo e defina preferencias para receber vagas mais alinhadas.</p>
        </div>
        <button className="secondary-button" type="button" onClick={onSave} disabled={isSaving}>
          {isSaving ? 'Salvando...' : 'Salvar preferencias'}
        </button>
      </div>
      <div className="career-layout">
        <section className="career-card">
          <div className="career-card-header">
            <h3>Curriculo</h3>
            <p>Suba seu arquivo e mantenha seus dados academicos atualizados.</p>
          </div>
          <div className="resume-upload-card">
            <span className="detail-label">Arquivo atual</span>
            <strong>{careerProfile.resumeFileName || 'Nenhum curriculo informado'}</strong>
            <label className="ghost-upload-button">
              Trocar curriculo
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) onCareerChange((current) => ({ ...current, resumeFileName: file.name }))
                }}
              />
            </label>
          </div>
          <div className="publish-grid">
            <label className="form-field"><span>Curso</span><input type="text" value={careerProfile.course} onChange={(event) => onCareerChange((current) => ({ ...current, course: event.target.value }))} /></label>
            <label className="form-field"><span>Semestre</span><input type="text" value={careerProfile.semester} onChange={(event) => onCareerChange((current) => ({ ...current, semester: event.target.value }))} /></label>
          </div>
        </section>
        <section className="career-card">
          <div className="career-card-header">
            <h3>Preferencias de vaga</h3>
            <p>Essas informacoes ajudam a priorizar oportunidades no mural.</p>
          </div>
          <div className="publish-grid">
            <label className="form-field"><span>Area desejada</span><input type="text" value={careerProfile.desiredArea} onChange={(event) => onCareerChange((current) => ({ ...current, desiredArea: event.target.value }))} /></label>
            <label className="form-field"><span>Pretensao salarial</span><input type="text" value={careerProfile.salaryExpectation} onChange={(event) => onCareerChange((current) => ({ ...current, salaryExpectation: event.target.value }))} /></label>
            <label className="form-field"><span>Modelo de trabalho</span><select value={careerProfile.workModel} onChange={(event) => onCareerChange((current) => ({ ...current, workModel: event.target.value }))}><option>Presencial</option><option>Hibrido</option><option>Remoto</option></select></label>
            <label className="form-field"><span>Cidade de preferencia</span><input type="text" value={careerProfile.preferredCity} onChange={(event) => onCareerChange((current) => ({ ...current, preferredCity: event.target.value }))} /></label>
          </div>
        </section>
      </div>
    </section>
  )
}
