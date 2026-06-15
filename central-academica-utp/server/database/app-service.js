import { connectToDatabase } from './connection.js'
import { sendApplicationEmail } from '../services/mail-service.js'

const importantDeadlines = [
  {
    title: 'Rematricula 2026/2',
    detail: 'Ate 05/07/2026',
    description: 'Periodo para confirmar sua continuidade no proximo semestre e evitar bloqueios academicos.',
    action: 'Acesse o portal do aluno, revise pendencias financeiras e confirme a grade de disciplinas.',
    channel: 'Portal do Aluno > Rematricula',
  },
  {
    title: 'Horas complementares',
    detail: 'Envio ate 18/06/2026',
    description: 'Prazo para anexar certificados e atividades complementares que contam para a integralizacao do curso.',
    action: 'Separe certificados em PDF, confira carga horaria e envie para analise da coordenacao.',
    channel: 'Secretaria academica',
  },
  {
    title: 'Solicitacao de estagio',
    detail: 'Validacao em 3 dias uteis',
    description: 'Fluxo de avaliacao de documentos de estagio, termo de compromisso e dados da empresa.',
    action: 'Envie os documentos completos e acompanhe a devolutiva antes de iniciar as atividades.',
    channel: 'Central de estagios',
  },
]

const secretaryEmail = 'secretaria@utp.br'
const lostItemOpenStatus = 'Perdido'
const lostItemRecoveredStatus = 'Recuperado'

const weekdayOrder = ['Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta']

async function ensureCareerProfileSchema(pool) {
  await pool.query(`alter table perfis_profissionais add column if not exists email_contato varchar(160)`)
  await pool.query(`alter table perfis_profissionais add column if not exists area_desejada varchar(120)`)
  await pool.query(`alter table perfis_profissionais add column if not exists pretensao_salarial varchar(80)`)
  await pool.query(`alter table perfis_profissionais add column if not exists modelo_trabalho varchar(40)`)
  await pool.query(`alter table perfis_profissionais add column if not exists cidade_preferencia varchar(120)`)
}

async function ensureJobApplicationSchema(pool) {
  await pool.query(`alter table candidaturas_vagas add column if not exists email_aluno varchar(160)`)
  await pool.query(`alter table candidaturas_vagas add column if not exists email_contato_vaga varchar(160)`)
  await pool.query(`alter table candidaturas_vagas add column if not exists data_criacao timestamp without time zone not null default now()`)
  await pool.query(`alter table candidaturas_vagas add column if not exists status_email varchar(40) not null default 'Pendente'`)
}

function normalizeWeekdays(weekdays = []) {
  if (!Array.isArray(weekdays)) {
    return []
  }

  const uniqueWeekdays = new Set(
    weekdays
      .map((value) => String(value ?? '').trim())
      .filter((value) => weekdayOrder.includes(value)),
  )

  return weekdayOrder.filter((day) => uniqueWeekdays.has(day))
}

function formatWeekdays(value) {
  if (Array.isArray(value)) {
    const normalized = normalizeWeekdays(value)
    return normalized.length ? normalized.join(', ') : 'Nao informado'
  }

  if (typeof value === 'string') {
    return value.trim() || 'Nao informado'
  }

  return 'Nao informado'
}

function getDisplayName(row) {
  if (row.nome) {
    return row.nome
  }

  if (row.login_admin) {
    return row.login_admin
  }

  return 'Estudante UTP'
}

function formatTimestamp(value) {
  if (!value) {
    return 'Sem data'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function mapPublication(row) {
  return {
    id: row.id_publicacao,
    category: row.categoria,
    title: row.titulo,
    subtitle: row.local_empresa || 'Central Academica UTP',
    tag: row.categoria,
    description: row.descricao,
    status: row.status_moderacao,
    submittedAt: formatTimestamp(row.data_submissao),
    author: row.autor,
    contactEmail: row.email_contato || secretaryEmail,
    button: row.categoria === 'Vaga' ? 'Candidatar-se' : null,
    meta:
      row.categoria === 'Vaga'
        ? [formatTimestamp(row.data_submissao), row.local_empresa || 'Campus UTP']
        : null,
  }
}

function mapRide(row) {
  return {
    id: row.id_carona,
    driverId: row.id_motorista,
    zone: row.zona_destino,
    title: row.titulo,
    driver: row.motorista,
    driverName: row.motorista, // Adicionado para garantir que a tela de moderacao pegue o nome
    time: `Saida ${row.horario_saida}`,
    seats: row.vagas,
    meeting: row.ponto_encontro,
    vehicle: row.veiculo,
    status: row.status_carona,
    whatsapp: row.whatsapp_motorista,
    requestCount: Number(row.total_solicitacoes ?? 0),
    weekdays: formatWeekdays(row.dias_semana),
  }
}

function mapLostItem(row) {
  return {
    id: row.id_item,
    title: row.titulo,
    place: row.local_encontrado,
    date: row.data_hora,
    status: row.status_item,
    category: row.categoria,
    description: row.descricao,
    foundBy: row.encontrado_por,
    contact: row.contato_retirada,
  }
}

function mapModerationItem(row) {
  return {
    id: row.id_publicacao,
    title: row.titulo,
    category: row.categoria,
    author: row.autor,
    status: row.status_moderacao,
    submittedAt: formatTimestamp(row.data_submissao),
    description: row.descricao,
    contactEmail: row.email_contato || 'secretaria@utp.br',
    location: row.local_empresa || 'Nao informado',
  }
}

function mapReport(row) {
  return {
    id: row.id_denuncia,
    title: row.titulo,
    detail: row.detalhe,
    status: row.status_denuncia,
    createdAt: formatTimestamp(row.data_criacao),
  }
}

function mapRideRequest(row) {
  return {
    id: row.id_pedido,
    requesterId: row.id_solicitante,
    requesterName: row.solicitante_nome,
    zone: row.zona_destino,
    pickupAddress: row.endereco_embarque,
    requesterWhatsapp: row.whatsapp_solicitante,
    weekdays: formatWeekdays(row.dias_semana),
    notes: row.observacoes,
    status: row.status_pedido,
    acceptedByUserId: row.id_usuario_aceitou,
    acceptedByName: row.usuario_aceitou_nome,
    acceptedByWhatsapp: row.motorista_aceitou_whatsapp,
    createdAt: formatTimestamp(row.data_criacao),
  }
}

function mapRideInterest(row) {
  return {
    id: row.id_solicitacao,
    rideId: row.id_carona,
    requesterId: row.id_solicitante,
    requesterName: row.solicitante_nome,
    requesterWhatsapp: row.whatsapp_solicitante,
    pickupAddress: row.endereco_embarque,
    status: row.status_solicitacao,
    createdAt: formatTimestamp(row.data_criacao),
  }
}

function mapCareerProfile(row) {
  if (!row) {
    return {
      course: '',
      semester: '',
      contactEmail: '',
      desiredArea: '',
      salaryExpectation: '',
      workModel: 'Hibrido',
      preferredCity: '',
    }
  }

  return {
    course: row.curso,
    semester: row.semestre,
    contactEmail: row.email_contato || '',
    desiredArea: row.area_desejada || '',
    salaryExpectation: row.pretensao_salarial || '',
    workModel: row.modelo_trabalho || 'Nao informado',
    preferredCity: row.cidade_preferencia || '',
  }
}

function buildHotspots(rides) {
  const defaultZones = ['Centro', 'Boqueirao', 'Pinheirinho', 'CIC']
  const dynamicZones = rides
    .map((ride) => ride.zone?.trim())
    .filter(Boolean)
  const zones = [...new Set([...dynamicZones, ...defaultZones])]

  return zones.map((zone) => {
    const zoneRides = rides.filter((ride) => ride.zone === zone && ride.status === 'Ativa')
    const count = zoneRides.length

    return {
      id: zone,
      name: zone,
      detail: `${count} ${count === 1 ? 'carona ativa' : 'caronas ativas'}`,
    }
  })
}

async function ensureAuditLogTable(pool) {
  await pool.query(`
    create table if not exists logs_auditoria (
      id_log serial primary key,
      id_usuario integer references usuarios(id_usuario) on delete set null,
      acao varchar(120) not null,
      entidade varchar(80) not null,
      id_entidade integer,
      detalhe jsonb,
      data_criacao timestamp without time zone not null default now()
    )
  `)
}

export async function recordAuditLog({ userId = null, action, entity, entityId = null, detail = {} }) {
  const pool = await connectToDatabase()

  try {
    await ensureAuditLogTable(pool)
    await pool.query(
      `
        insert into logs_auditoria (id_usuario, acao, entidade, id_entidade, detalhe, data_criacao)
        values ($1, $2, $3, $4, $5::jsonb, now())
      `,
      [userId, action, entity, entityId, JSON.stringify(detail ?? {})],
    )
  } catch (error) {
    console.error('Nao foi possivel registrar log de auditoria.', error)
  }
}

async function getUserById(userId) {
  const pool = await connectToDatabase()
  const result = await pool.query(
    `
      select id_usuario, ra, login_admin, role
      , nome
      from usuarios
      where id_usuario = $1
      limit 1
    `,
    [userId],
  )

  return result.rows[0] ?? null
}

async function getVisibleRideRequests(pool, userId) {
  return pool.query(
    `
      select
        p.*,
        coalesce(nullif(solicitante.nome, ''), nullif(solicitante.login_admin, ''), 'Estudante UTP') as solicitante_nome,
        coalesce(nullif(aceitou.nome, ''), nullif(aceitou.login_admin, ''), 'Estudante UTP') as usuario_aceitou_nome
      from pedidos_caronas p
      left join usuarios solicitante on solicitante.id_usuario = p.id_solicitante
      left join usuarios aceitou on aceitou.id_usuario = p.id_usuario_aceitou
      where p.status_pedido = 'Aberto'
         or p.id_solicitante = $1
      order by
        case when p.status_pedido = 'Aberto' then 0 else 1 end,
        p.data_criacao desc,
        p.id_pedido desc
    `,
    [userId],
  )
}

async function getVisibleRideInterests(pool, userId) {
  return pool.query(
    `
      select
        s.*,
        coalesce(nullif(u.nome, ''), nullif(u.login_admin, ''), 'Estudante UTP') as solicitante_nome
      from solicitacoes_caronas s
      inner join caronas c on c.id_carona = s.id_carona
      left join usuarios u on u.id_usuario = s.id_solicitante
      where c.id_motorista = $1
      order by s.data_criacao desc, s.id_solicitacao desc
    `,
    [userId],
  )
}

export async function loginStudent(ra, birthDate) {
  const pool = await connectToDatabase()
  const result = await pool.query(
    `
      select id_usuario, ra, login_admin, role
      , nome
      from usuarios
      where ra = $1
        and data_nascimento = $2::date
      limit 1
    `,
    [ra, birthDate],
  )

  const user = result.rows[0]

  if (!user) {
    return null
  }

  return {
    id: user.id_usuario,
    role: 'student',
    name: getDisplayName(user),
  }
}

export async function loginAdmin(login, password) {
  const pool = await connectToDatabase()
  const result = await pool.query(
    `
      select id_usuario, ra, login_admin, role
      , nome
      from usuarios
      where login_admin = $1
        and senha_admin = $2
        and role = 'admin'
      limit 1
    `,
    [login, password],
  )

  const user = result.rows[0]

  if (!user) {
    return null
  }

  return {
    id: user.id_usuario,
    role: 'admin',
    name: getDisplayName(user),
  }
}

export async function getAppData(userId, role) {
  const pool = await connectToDatabase()
  await ensureCareerProfileSchema(pool)
  await ensureJobApplicationSchema(pool)

  const user = await getUserById(userId)
  const isAdmin = role === 'admin'

  if (!user) {
    throw new Error('Usuario nao encontrado.')
  }

  const [ridesResult, lostItemsResult, publicationsResult, profileResult, rideRequestsResult, rideInterestsResult, applicationsResult, adminMetricsResult, reportsResult] =
    await Promise.all([
      pool.query(
        `
          select
            c.*,
            coalesce(requests.total_solicitacoes, 0) as total_solicitacoes,
            coalesce(nullif(u.nome, ''), nullif(u.login_admin, ''), 'Estudante UTP') as motorista
          from caronas c
          left join usuarios u on u.id_usuario = c.id_motorista
          left join (
            select id_carona, count(*) as total_solicitacoes
            from solicitacoes_caronas
            where status_solicitacao = 'Pendente'
            group by id_carona
          ) requests on requests.id_carona = c.id_carona
          where ($1 = 'admin' or c.status_carona = 'Ativa' or c.id_motorista = $2)
          order by c.id_carona desc
        `,
        [role, userId],
      ),
      pool.query(
        `
          select *
          from achados_perdidos
          where status_item <> $1
          order by id_item desc
        `,
        [lostItemRecoveredStatus],
      ),
      pool.query(
        `
          select
            p.*,
            coalesce(nullif(u.nome, ''), nullif(u.login_admin, ''), 'Estudante UTP') as autor
          from publicacoes_mural p
          left join usuarios u on u.id_usuario = p.id_autor
          where ($1 = 'admin' or p.status_moderacao = 'Aprovado')
          order by p.data_submissao desc, p.id_publicacao desc
        `,
        [role],
      ),
      pool.query(
        `
          select *
          from perfis_profissionais
          where id_usuario = $1
          order by id_perfil desc
          limit 1
        `,
        [userId],
      ),
      getVisibleRideRequests(pool, userId),
      getVisibleRideInterests(pool, userId),
      pool.query(
        `
          select distinct on (id_publicacao)
            id_publicacao,
            email_contato_vaga,
            status_email,
            data_criacao
          from candidaturas_vagas
          where id_usuario = $1
          order by id_publicacao, data_criacao desc
        `,
        [userId],
      ),
      isAdmin
        ? pool.query(
            `
              select
                (select count(*) from candidaturas_vagas) as total_interesses,
                (select count(*) from candidaturas_vagas where status_email = 'Enviado') as emails_enviados,
                (select count(*) from publicacoes_mural where status_moderacao = 'Aprovado') as publicacoes_aprovadas,
                (select count(*) from achados_perdidos where status_item = $1) as itens_recuperados,
                (select count(*) from caronas where status_carona <> 'Ativa') as caronas_encerradas
            `,
            [lostItemRecoveredStatus],
          )
        : Promise.resolve({ rows: [{}] }),
      isAdmin
        ? pool.query(
            `
              select *
              from denuncias
              order by data_criacao desc, id_denuncia desc
            `,
          )
        : Promise.resolve({ rows: [] }),
    ])

  const rides = ridesResult.rows.map(mapRide)
  const lostItems = lostItemsResult.rows.map(mapLostItem)
  const muralPosts = publicationsResult.rows.map(mapPublication)
  const moderationQueue = isAdmin ? publicationsResult.rows.map(mapModerationItem) : []
  const reports = reportsResult.rows.map(mapReport)
  const careerProfile = mapCareerProfile(profileResult.rows[0] ?? null)
  const rideRequestsInbox = rideRequestsResult.rows.map(mapRideRequest)
  const rideInterestsInbox = rideInterestsResult.rows.map(mapRideInterest)
  const appliedPostIds = applicationsResult.rows.map((row) => Number(row.id_publicacao)).filter(Boolean)
  const jobInterests = applicationsResult.rows.map((row) => ({
    postId: Number(row.id_publicacao),
    emailStatus: row.status_email,
    contactEmail: row.email_contato_vaga,
    createdAt: formatTimestamp(row.data_criacao),
  }))
  const adminMetrics = adminMetricsResult.rows[0] ?? {}

  return {
    user: {
      id: user.id_usuario,
      role,
      name: getDisplayName(user),
    },
    dashboard: {
      ridesCount: rides.filter((ride) => ride.status === 'Ativa').length,
      lostItemsCount: lostItems.length,
      muralCount: muralPosts.length,
      pendingModerationCount: moderationQueue.filter((item) => item.status !== 'Aprovado').length,
      reportsCount: reports.filter((item) => item.status !== 'Resolvida').length,
      approvedPublicationsCount: Number(adminMetrics.publicacoes_aprovadas || muralPosts.filter((item) => item.status === 'Aprovado').length),
      jobInterestsCount: Number(adminMetrics.total_interesses || appliedPostIds.length),
      sentEmailsCount: Number(adminMetrics.emails_enviados || 0),
      recoveredLostItemsCount: Number(adminMetrics.itens_recuperados || 0),
      closedRidesCount: Number(adminMetrics.caronas_encerradas || rides.filter((ride) => ride.status !== 'Ativa').length),
    },
    rides,
    rideHotspots: buildHotspots(rides),
    lostItems,
    muralPosts,
    appliedPostIds,
    jobInterests,
    moderationQueue,
    reports,
    rideRequestsInbox,
    rideInterestsInbox,
    importantDeadlines,
    careerProfile,
  }
}

export async function createPublication({ userId, role, category, title, location, contactEmail, description }) {
  const pool = await connectToDatabase()
  const moderationStatus = role === 'admin' ? 'Aprovado' : 'Pendente'

  const result = await pool.query(
    `
      insert into publicacoes_mural (
        id_autor,
        categoria,
        titulo,
        local_empresa,
        email_contato,
        descricao,
        status_moderacao,
        data_submissao
      )
      values ($1, $2, $3, $4, $5, $6, $7, now())
      returning id_publicacao
    `,
    [userId, category, title, location || 'Central Academica UTP', contactEmail || secretaryEmail, description, moderationStatus],
  )

  await recordAuditLog({
    userId,
    action: 'PUBLICACAO_CRIADA',
    entity: 'publicacoes_mural',
    entityId: result.rows[0]?.id_publicacao,
    detail: { category, title, status: moderationStatus },
  })

  return getAppData(userId, role === 'admin' ? 'admin' : 'student')
}

export async function createLostItem({
  userId,
  role, // <-- Adicionado aqui
  title,
  place,
  date,
  category,
  description,
  foundBy,
}) {
  const pool = await connectToDatabase()

  const result = await pool.query(
    `
      insert into achados_perdidos (
        id_usuario_registro,
        titulo,
        local_encontrado,
        data_hora,
        status_item,
        categoria,
        descricao,
        encontrado_por,
        contato_retirada
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      returning id_item
    `,
    [userId, title, place, date, lostItemOpenStatus, category, description, foundBy, secretaryEmail],
  )

  await recordAuditLog({
    userId,
    action: 'ITEM_ACHADO_REGISTRADO',
    entity: 'achados_perdidos',
    entityId: result.rows[0]?.id_item,
    detail: { title, category, place, status: lostItemOpenStatus },
  })

  // 👇 Substituição feita aqui na última linha:
  return getAppData(userId, role || 'student')
}

export async function createRide({
  userId,
  zone,
  title,
  departureTime,
  seats,
  meetingPoint,
  vehicle,
  whatsapp,
  weekdays,
}) {
  const pool = await connectToDatabase()
  const normalizedWeekdays = normalizeWeekdays(weekdays)

  if (!normalizedWeekdays.length) {
    throw new Error('Selecione pelo menos um dia da semana para a carona.')
  }

  const result = await pool.query(
    `
      insert into caronas (
        id_motorista,
        zona_destino,
        titulo,
        horario_saida,
        vagas,
        ponto_encontro,
        veiculo,
        whatsapp_motorista,
        dias_semana,
        status_carona
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Ativa')
      returning id_carona
    `,
    [userId, zone, title, departureTime, seats, meetingPoint, vehicle, whatsapp, normalizedWeekdays],
  )

  await recordAuditLog({
    userId,
    action: 'CARONA_CRIADA',
    entity: 'caronas',
    entityId: result.rows[0]?.id_carona,
    detail: { zone, title, departureTime, seats, weekdays: normalizedWeekdays },
  })

  return getAppData(userId, 'student')
}

// ==== NOVA FUNÇÃO: Deletar Carona ====
export async function deleteRide(rideId, userId) {
  const pool = await connectToDatabase()

  // Opcional: Aqui poderiamos verificar se o userId é ADMIN ou DONO da carona
  // Para simplificar, estamos assumindo que a chamada que chegou aqui já tem permissão.

  const result = await pool.query(
    `
      delete from caronas
      where id_carona = $1
      returning id_carona
    `,
    [rideId],
  )

  if (!result.rowCount) {
    throw new Error('Carona nao encontrada para exclusao.')
  }

  await recordAuditLog({
    userId,
    action: 'CARONA_EXCLUIDA',
    entity: 'caronas',
    entityId: rideId,
    detail: { message: 'Carona deletada permanentemente pelo moderador/usuario' },
  })

  return result.rows[0]
}
// =====================================

export async function createRideRequest({ zone, userId, whatsapp, pickupAddress, weekdays = [] }) {
  const pool = await connectToDatabase()
  const normalizedWeekdays = normalizeWeekdays(weekdays)

  if (!normalizedWeekdays.length) {
    throw new Error('Selecione pelo menos um dia da semana para o pedido.')
  }

  const activeRequestsResult = await pool.query(
    `
      select count(*)::int as total
      from pedidos_caronas
      where id_solicitante = $1
        and status_pedido in ('Aberto', 'Aceito')
    `,
    [userId],
  )

  if ((activeRequestsResult.rows[0]?.total ?? 0) >= 2) {
    throw new Error('Voce pode manter no maximo 2 pedidos de carona ativos ao mesmo tempo.')
  }

  const result = await pool.query(
    `
      insert into pedidos_caronas (
        id_solicitante,
        zona_destino,
        whatsapp_solicitante,
        endereco_embarque,
        dias_semana,
        observacoes,
        status_pedido,
        data_criacao
      )
      values ($1, $2, $3, $4, $5, null, 'Aberto', now())
      returning id_pedido
    `,
    [userId, zone, whatsapp, pickupAddress, normalizedWeekdays],
  )

  await recordAuditLog({
    userId,
    action: 'PEDIDO_CARONA_CRIADO',
    entity: 'pedidos_caronas',
    entityId: result.rows[0]?.id_pedido,
    detail: { zone, status: 'Aberto', weekdays: normalizedWeekdays },
  })

  return getAppData(userId, 'student')
}

export async function createRideInterest({ rideId, userId, whatsapp, pickupAddress }) {
  const pool = await connectToDatabase()

  const existingInterest = await pool.query(
    `
      select id_solicitacao
      from solicitacoes_caronas
      where id_carona = $1
        and id_solicitante = $2
        and status_solicitacao = 'Pendente'
      limit 1
    `,
    [rideId, userId],
  )

  if (existingInterest.rowCount) {
    throw new Error('Voce ja declarou interesse nessa carona.')
  }

  const result = await pool.query(
    `
      insert into solicitacoes_caronas (
        id_carona,
        id_solicitante,
        whatsapp_solicitante,
        endereco_embarque,
        status_solicitacao,
        data_criacao
      )
      values ($1, $2, $3, $4, 'Pendente', now())
      returning id_solicitacao
    `,
    [rideId, userId, whatsapp, pickupAddress],
  )

  await recordAuditLog({
    userId,
    action: 'INTERESSE_CARONA_CRIADO',
    entity: 'solicitacoes_caronas',
    entityId: result.rows[0]?.id_solicitacao,
    detail: { rideId, status: 'Pendente' },
  })

  return getAppData(userId, 'student')
}

export async function updateRide({
  rideId,
  userId,
  zone,
  title,
  departureTime,
  seats,
  meetingPoint,
  vehicle,
  whatsapp,
  weekdays,
}) {
  const pool = await connectToDatabase()
  const normalizedWeekdays = normalizeWeekdays(weekdays)

  if (!normalizedWeekdays.length) {
    throw new Error('Selecione pelo menos um dia da semana para a carona.')
  }

  const result = await pool.query(
    `
      update caronas
      set zona_destino = $3,
        titulo = $4,
        horario_saida = $5,
        vagas = $6,
        ponto_encontro = $7,
        veiculo = $8,
        whatsapp_motorista = $9,
        dias_semana = $10
      where id_carona = $1
        and id_motorista = $2
      returning id_carona
    `,
    [rideId, userId, zone, title, departureTime, seats, meetingPoint, vehicle, whatsapp, normalizedWeekdays],
  )

  if (!result.rowCount) {
    throw new Error('Nao foi possivel atualizar essa carona.')
  }

  await recordAuditLog({
    userId,
    action: 'CARONA_ATUALIZADA',
    entity: 'caronas',
    entityId: rideId,
    detail: { zone, title, departureTime, seats, weekdays: normalizedWeekdays },
  })

  return getAppData(userId, 'student')
}

export async function closeRide(rideId, userId) {
  const pool = await connectToDatabase()
  const result = await pool.query(
    `
      update caronas
      set status_carona = 'Lotada'
      where id_carona = $1
        and id_motorista = $2
    `,
    [rideId, userId],
  )

  if (!result.rowCount) {
    throw new Error('Nao foi possivel encerrar a vaga dessa carona.')
  }

  await recordAuditLog({
    userId,
    action: 'CARONA_ENCERRADA',
    entity: 'caronas',
    entityId: rideId,
    detail: { status: 'Lotada' },
  })

  return getAppData(userId, 'student')
}

export async function updateRideRequest({ requestId, userId, zone, whatsapp, pickupAddress, weekdays = [] }) {
  const pool = await connectToDatabase()
  const normalizedWeekdays = normalizeWeekdays(weekdays)

  if (!normalizedWeekdays.length) {
    throw new Error('Selecione pelo menos um dia da semana para o pedido.')
  }

  const result = await pool.query(
    `
      update pedidos_caronas
      set zona_destino = $3,
        whatsapp_solicitante = $4,
        endereco_embarque = $5,
        dias_semana = $6
      where id_pedido = $1
        and id_solicitante = $2
      returning id_pedido
    `,
    [requestId, userId, zone, whatsapp, pickupAddress, normalizedWeekdays],
  )

  if (!result.rowCount) {
    throw new Error('Nao foi possivel atualizar esse pedido de carona.')
  }

  await recordAuditLog({
    userId,
    action: 'PEDIDO_CARONA_ATUALIZADO',
    entity: 'pedidos_caronas',
    entityId: requestId,
    detail: { zone, weekdays: normalizedWeekdays },
  })

  return getAppData(userId, 'student')
}

export async function updateRideRequestStatus(requestId, userId, status) {
  const pool = await connectToDatabase()

  let acceptedDriverWhatsapp = null

  if (status === 'Aceito') {
    const driverRideResult = await pool.query(
      `
        select whatsapp_motorista
        from caronas
        where id_motorista = $1
        order by
          case when status_carona = 'Ativa' then 0 else 1 end,
          id_carona desc
        limit 1
      `,
      [userId],
    )

    acceptedDriverWhatsapp = driverRideResult.rows[0]?.whatsapp_motorista ?? null
  }

  const requestResult = await pool.query(
    `
      select id_pedido, id_solicitante
      from pedidos_caronas
      where id_pedido = $1
      limit 1
    `,
    [requestId],
  )

  const request = requestResult.rows[0]

  if (!request) {
    throw new Error('Pedido de carona nao encontrado.')
  }

  if (request.id_solicitante === userId) {
    throw new Error('Voce nao pode aceitar o seu proprio pedido.')
  }

  await pool.query(
    `
      update pedidos_caronas
      set status_pedido = $2,
        id_usuario_aceitou = $3,
        motorista_aceitou_whatsapp = $4
      where id_pedido = $1
      returning id_pedido
    `,
    [requestId, status, status === 'Aceito' ? userId : null, status === 'Aceito' ? acceptedDriverWhatsapp : null],
  )

  await recordAuditLog({
    userId,
    action: 'STATUS_PEDIDO_CARONA_ATUALIZADO',
    entity: 'pedidos_caronas',
    entityId: requestId,
    detail: { status, requesterId: request.id_solicitante },
  })

  return getAppData(userId, 'student')
}

export async function deleteRideRequest(requestId, userId, role = 'student') {
  const pool = await connectToDatabase()

  const result = await pool.query(
    `
      delete from pedidos_caronas
      where id_pedido = $1
        and ($2 = 'admin' or id_solicitante = $3)
      returning id_pedido
    `,
    [requestId, role, userId],
  )

  if (!result.rowCount) {
    throw new Error('Nao foi possivel excluir esse pedido de carona.')
  }

  await recordAuditLog({
    userId,
    action: 'PEDIDO_CARONA_EXCLUIDO',
    entity: 'pedidos_caronas',
    entityId: requestId,
    detail: {},
  })

  // Retorna os dados corretos dependendo de quem excluiu
  return getAppData(userId, role === 'admin' ? 'admin' : 'student')
}

export async function markLostItemRecovered(itemId, userId, role) {
  if (role !== 'admin') {
    throw new Error('Apenas administradores podem marcar itens como recuperados.')
  }

  const pool = await connectToDatabase()
  const result = await pool.query(
    `
      update achados_perdidos
      set status_item = $2
      where id_item = $1
      returning id_item
    `,
    [itemId, lostItemRecoveredStatus],
  )

  if (!result.rowCount) {
    throw new Error('Item de achados e perdidos nao encontrado.')
  }

  await recordAuditLog({
    userId,
    action: 'ITEM_ACHADO_RECUPERADO',
    entity: 'achados_perdidos',
    entityId: itemId,
    detail: { status: lostItemRecoveredStatus },
  })

  return getAppData(userId, role)
}

export async function updatePublicationStatus(publicationId, status, userId, role) {
  const pool = await connectToDatabase()

  const result = await pool.query(
    `
      update publicacoes_mural
      set status_moderacao = $2
      where id_publicacao = $1
      returning id_publicacao
    `,
    [publicationId, status],
  )

  if (!result.rowCount) {
    throw new Error('Publicacao nao encontrada.')
  }

  await recordAuditLog({
    userId,
    action: 'PUBLICACAO_MODERADA',
    entity: 'publicacoes_mural',
    entityId: publicationId,
    detail: { status },
  })

  return getAppData(userId, role)
}

export async function deletePublication(publicationId) {
  const pool = await connectToDatabase()

  const result = await pool.query(
    `
      delete from publicacoes_mural
      where id_publicacao = $1
      returning id_publicacao
    `,
    [publicationId],
  )

  if (!result.rowCount) {
    throw new Error('Publicacao nao encontrada para exclusao.')
  }

  return result.rows[0]
}

export async function saveCareerProfile(userId, profile) {
  const pool = await connectToDatabase()
  await ensureCareerProfileSchema(pool)
  const normalizedWorkModel = ['Presencial', 'Hibrido', 'Remoto'].includes(profile.workModel)
    ? profile.workModel
    : null

  const existing = await pool.query(
    `
      select id_perfil
      from perfis_profissionais
      where id_usuario = $1
      order by id_perfil desc
      limit 1
    `,
    [userId],
  )

  if (existing.rowCount) {
    await pool.query(
      `
        update perfis_profissionais
        set curso = $2,
            semestre = $3,
            email_contato = $4,
            area_desejada = $5,
            pretensao_salarial = $6,
            modelo_trabalho = $7,
            cidade_preferencia = $8
        where id_perfil = $1
      `,
      [
        existing.rows[0].id_perfil,
        profile.course,
        profile.semester,
        profile.contactEmail,
        profile.desiredArea,
        profile.salaryExpectation || null,
        normalizedWorkModel,
        profile.preferredCity || null,
      ],
    )

    await recordAuditLog({
      userId,
      action: 'PERFIL_PROFISSIONAL_ATUALIZADO',
      entity: 'perfis_profissionais',
      entityId: existing.rows[0].id_perfil,
      detail: { course: profile.course, semester: profile.semester },
    })
  } else {
    const result = await pool.query(
      `
        insert into perfis_profissionais (
          id_usuario,
          curso,
          semestre,
          email_contato,
          area_desejada,
          pretensao_salarial,
          modelo_trabalho,
          cidade_preferencia
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8)
        returning id_perfil
      `,
      [
        userId,
        profile.course,
        profile.semester,
        profile.contactEmail,
        profile.desiredArea,
        profile.salaryExpectation || null,
        normalizedWorkModel,
        profile.preferredCity || null,
      ],
    )

    await recordAuditLog({
      userId,
      action: 'PERFIL_PROFISSIONAL_CRIADO',
      entity: 'perfis_profissionais',
      entityId: result.rows[0]?.id_perfil,
      detail: { course: profile.course, semester: profile.semester },
    })
  }

  return getAppData(userId, 'student')
}

export async function createJobApplication({ userId, publicationId, studentName }) {
  const pool = await connectToDatabase()
  await ensureCareerProfileSchema(pool)
  await ensureJobApplicationSchema(pool)

  const [publicationResult, profileResult] = await Promise.all([
    pool.query(
      `
        select
          p.*,
          coalesce(nullif(u.nome, ''), nullif(u.login_admin, ''), 'Estudante UTP') as autor
        from publicacoes_mural p
        left join usuarios u on u.id_usuario = p.id_autor
        where p.id_publicacao = $1
          and p.categoria = 'Vaga'
          and p.status_moderacao = 'Aprovado'
        limit 1
      `,
      [publicationId],
    ),
    pool.query(
      `
        select *
        from perfis_profissionais
        where id_usuario = $1
        order by id_perfil desc
        limit 1
      `,
      [userId],
    ),
  ])

  const post = publicationResult.rows[0] ? mapPublication(publicationResult.rows[0]) : null
  const profile = mapCareerProfile(profileResult.rows[0] ?? null)

  if (!post) {
    throw new Error('Vaga nao encontrada ou indisponivel para declarar interesse.')
  }

  if (!profile.contactEmail) {
    throw new Error('Informe um e-mail de contato no perfil profissional antes de declarar interesse.')
  }

  const contactEmail = post.contactEmail || secretaryEmail
  const insertResult = await pool.query(
    `
      insert into candidaturas_vagas (
        id_publicacao,
        id_usuario,
        email_aluno,
        email_contato_vaga,
        status_email,
        data_criacao
      )
      values ($1, $2, $3, $4, 'Pendente', now())
      returning id_candidatura
    `,
    [publicationId, userId, profile.contactEmail, contactEmail],
  )

  const emailResult = await sendApplicationEmail({
    to: profile.contactEmail,
    studentName,
    post,
    profile,
    contactEmail,
  })

  await pool.query(
    `
      update candidaturas_vagas
      set status_email = $2
      where id_candidatura = $1
    `,
    [insertResult.rows[0].id_candidatura, emailResult.sent ? 'Enviado' : 'Nao enviado'],
  )

  await recordAuditLog({
    userId,
    action: 'CANDIDATURA_VAGA_CRIADA',
    entity: 'candidaturas_vagas',
    entityId: insertResult.rows[0].id_candidatura,
    detail: {
      publicationId,
      emailStatus: emailResult.sent ? 'Enviado' : 'Nao enviado',
      contactEmail,
    },
  })

  return {
    id: insertResult.rows[0].id_candidatura,
    emailSent: emailResult.sent,
    emailMessage: emailResult.sent
      ? `Enviamos as informacoes da vaga para ${profile.contactEmail}.`
      : `Seu interesse foi registrado, mas o e-mail automatico nao foi enviado. Motivo: ${emailResult.reason || 'falha desconhecida no SMTP'}.`,
    contactEmail,
    post,
  }
}

export async function getAdminDatabaseSnapshot(userId) {
  const pool = await connectToDatabase()
  await ensureCareerProfileSchema(pool)
  await ensureJobApplicationSchema(pool)

  const user = await getUserById(userId)

  if (!user || user.role !== 'admin') {
    throw new Error('Apenas administradores podem acessar a visualizacao de tabelas.')
  }

  const [
    usersResult,
    publicationsResult,
    ridesResult,
    rideRequestsResult,
    publicRideRequestsResult,
    applicationsResult,
    lostItemsResult,
    profilesResult,
    reportsResult,
    auditLogsResult,
  ] = await Promise.all([
    pool.query(
      `
        select id_usuario, nome, ra, login_admin, role, is_validado, data_criacao
        from usuarios
        order by id_usuario desc
      `,
    ),
    pool.query(
      `
        select id_publicacao, id_autor, categoria, titulo, local_empresa, status_moderacao, data_submissao
        from publicacoes_mural
        order by id_publicacao desc
      `,
    ),
    pool.query(
      `
        select id_carona, id_motorista, zona_destino, titulo, horario_saida, vagas, ponto_encontro, veiculo, status_carona
        from caronas
        order by id_carona desc
      `,
    ),
    pool.query(
      `
        select id_solicitacao, id_carona, id_solicitante, whatsapp_solicitante, endereco_embarque, status_solicitacao, data_criacao
        from solicitacoes_caronas
        order by id_solicitacao desc
      `,
    ),
    pool.query(
      `
        select id_pedido, id_solicitante, zona_destino, endereco_embarque, whatsapp_solicitante, status_pedido, id_usuario_aceitou, motorista_aceitou_whatsapp, data_criacao
        from pedidos_caronas
        order by id_pedido desc
      `,
    ),
    pool.query(
      `
        select id_candidatura, id_publicacao, id_usuario, email_aluno, email_contato_vaga, status_email, data_criacao
        from candidaturas_vagas
        order by id_candidatura desc
      `,
    ),
    pool.query(
      `
        select id_item, id_usuario_registro, titulo, local_encontrado, data_hora, status_item, categoria
        from achados_perdidos
        order by id_item desc
      `,
    ),
    pool.query(
      `
        select id_perfil, id_usuario, curso, semestre, email_contato, area_desejada, modelo_trabalho, cidade_preferencia
        from perfis_profissionais
        order by id_perfil desc
      `,
    ),
    pool.query(
      `
        select id_denuncia, titulo, status_denuncia, data_criacao
        from denuncias
        order by id_denuncia desc
      `,
    ),
    pool.query(
      `
        select
          l.id_log,
          l.id_usuario,
          coalesce(nullif(u.nome, ''), nullif(u.login_admin, ''), 'Sistema') as usuario,
          l.acao,
          l.entidade,
          l.id_entidade,
          l.detalhe,
          l.data_criacao
        from logs_auditoria l
        left join usuarios u on u.id_usuario = l.id_usuario
        order by l.data_criacao desc, l.id_log desc
        limit 200
      `,
    ),
  ])

  return {
    totals: {
      usuarios: usersResult.rows.length,
      publicacoes_mural: publicationsResult.rows.length,
      caronas: ridesResult.rows.length,
      solicitacoes_caronas: rideRequestsResult.rows.length,
      pedidos_caronas: publicRideRequestsResult.rows.length,
      candidaturas_vagas: applicationsResult.rows.length,
      achados_perdidos: lostItemsResult.rows.length,
      perfis_profissionais: profilesResult.rows.length,
      denuncias: reportsResult.rows.length,
      logs_auditoria: auditLogsResult.rows.length,
    },
    tables: {
      usuarios: usersResult.rows,
      publicacoes_mural: publicationsResult.rows,
      caronas: ridesResult.rows,
      solicitacoes_caronas: rideRequestsResult.rows,
      pedidos_caronas: publicRideRequestsResult.rows,
      candidaturas_vagas: applicationsResult.rows,
      achados_perdidos: lostItemsResult.rows,
      perfis_profissionais: profilesResult.rows,
      denuncias: reportsResult.rows,
      logs_auditoria: auditLogsResult.rows,
    },
  }
}
