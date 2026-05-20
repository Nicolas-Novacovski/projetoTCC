import type { CareerProfile, CareerProfileSetter } from '../types/app'

type CareerViewProps = {
  careerProfile: CareerProfile
  isSaving: boolean
  onCareerChange: CareerProfileSetter
  onSave: () => void
}

const courseOptions = [
  'Administracao',
  'Analise e Desenvolvimento de Sistemas',
  'Arquitetura e Urbanismo',
  'Ciencias Contabeis',
  'Direito',
  'Engenharia Civil',
  'Engenharia de Software',
  'Marketing',
  'Pedagogia',
  'Psicologia',
]

const semesterOptions = Array.from({ length: 10 }, (_, index) => `${index + 1} semestre`)

const desiredAreaOptions = [
  'Desenvolvimento Front-end',
  'Desenvolvimento Back-end',
  'Suporte e Infraestrutura',
  'Dados e Business Intelligence',
  'Administrativo',
  'Financeiro',
  'Juridico',
  'Marketing e Comunicacao',
  'Recursos Humanos',
  'Atendimento',
]

export function CareerView({
  careerProfile,
  isSaving,
  onCareerChange,
  onSave,
}: CareerViewProps) {
  const requiredFields = [
    careerProfile.course,
    careerProfile.semester,
    careerProfile.resumeFileName,
    careerProfile.contactEmail,
    careerProfile.desiredArea,
  ]
  const completedRequiredFields = requiredFields.filter((value) => String(value ?? '').trim()).length
  const isReadyForInterests = completedRequiredFields === requiredFields.length
  const readinessLabel = isReadyForInterests ? 'Pronto para declarar interesse' : 'Perfil em preparacao'
  const requirementItems = [
    { label: 'Curso', done: Boolean(careerProfile.course.trim()) },
    { label: 'Semestre', done: Boolean(careerProfile.semester.trim()) },
    { label: 'Curriculo', done: Boolean(careerProfile.resumeFileName.trim()) },
    { label: 'E-mail', done: Boolean(careerProfile.contactEmail.trim()) },
    { label: 'Area desejada', done: Boolean(careerProfile.desiredArea.trim()) },
  ]

  return (
    <section className="page-section career-section">
      <div className="page-heading">
        <div>
          <h2>Perfil Profissional</h2>
          <p>Cadastre seu curriculo e defina preferencias para receber vagas mais alinhadas.</p>
        </div>
       <button className="primary-button" type="button" onClick={onSave} disabled={isSaving}>
  {isSaving ? 'Salvando...' : 'Salvar preferencias'}
</button>
      </div>
      <section className="career-overview" aria-label="Resumo do perfil profissional">
        <div className="career-progress-panel career-hero-panel">
          <span className="detail-tag">{readinessLabel}</span>
          <h3>{isReadyForInterests ? 'Perfil profissional pronto' : 'Complete os dados obrigatorios'}</h3>
            <p>Esses dados ficam salvos no banco e alimentam seus interesses em vagas no mural.</p>
          <div className="career-progress-track" aria-label={`${completedRequiredFields} de ${requiredFields.length} campos obrigatorios preenchidos`}>
            <span style={{ width: `${(completedRequiredFields / requiredFields.length) * 100}%` }} />
          </div>
          <span className="career-progress-caption">{completedRequiredFields}/{requiredFields.length} campos obrigatorios preenchidos</span>
          <div className="career-requirements">
            {requirementItems.map((item) => (
              <span key={item.label} className={item.done ? 'is-complete' : ''}>{item.label}</span>
            ))}
          </div>
        </div>
        <div className="career-summary-strip">
          <div><span className="detail-label">Area</span><strong>{careerProfile.desiredArea || 'Nao informada'}</strong></div>
          <div><span className="detail-label">Curso</span><strong>{careerProfile.course || 'Nao informado'}</strong></div>
          <div><span className="detail-label">Semestre</span><strong>{careerProfile.semester || 'Nao informado'}</strong></div>
          <div><span className="detail-label">Curriculo</span><strong>{careerProfile.resumeFileName ? 'Anexado' : 'Pendente'}</strong></div>
          <div><span className="detail-label">E-mail</span><strong>{careerProfile.contactEmail || 'Nao informado'}</strong></div>
        </div>
      </section>
      <div className="career-profile-grid">
        <section className="career-card career-form-card career-main-form">
          <div className="career-card-header">
            <h3>Dados para interesse em vagas</h3>
            <p>Padronize suas informacoes para evitar cadastros duplicados ou preenchimentos divergentes.</p>
          </div>
          <div className="publish-grid">
            <label className="form-field">
              <span>Curso</span>
              <select value={careerProfile.course} onChange={(event) => onCareerChange((current) => ({ ...current, course: event.target.value }))}>
                <option value="">Selecione o curso</option>
                {courseOptions.map((course) => <option key={course} value={course}>{course}</option>)}
              </select>
            </label>
            <label className="form-field">
              <span>Semestre</span>
              <select value={careerProfile.semester} onChange={(event) => onCareerChange((current) => ({ ...current, semester: event.target.value }))}>
                <option value="">Selecione o semestre</option>
                {semesterOptions.map((semester) => <option key={semester} value={semester}>{semester}</option>)}
              </select>
            </label>
            <label className="form-field">
              <span>Area desejada</span>
              <select value={careerProfile.desiredArea} onChange={(event) => onCareerChange((current) => ({ ...current, desiredArea: event.target.value }))}>
                <option value="">Selecione a area</option>
                {desiredAreaOptions.map((area) => <option key={area} value={area}>{area}</option>)}
              </select>
            </label>
            <label className="form-field"><span>E-mail para receber vagas</span><input type="email" value={careerProfile.contactEmail} onChange={(event) => onCareerChange((current) => ({ ...current, contactEmail: event.target.value }))} /></label>
          </div>
        </section>
        <section className="career-card career-form-card career-resume-card">
          <div className="career-card-header">
            <h3>Curriculo</h3>
            <p>O arquivo fica registrado pelo nome para uso nos interesses declarados.</p>
          </div>
          <div className="resume-upload-card">
            <span className="detail-label">Arquivo atual</span>
            <strong>{careerProfile.resumeFileName || 'Nenhum curriculo informado'}</strong>
            <label className="ghost-upload-button">
              Selecionar curriculo
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) onCareerChange((current) => ({ ...current, resumeFileName: file.name }))
                }}
              />
            </label>
            <p className="resume-upload-hint">Aceitamos PDF, DOC ou DOCX.</p>
          </div>
        </section>
      </div>
    </section>
  )
}
