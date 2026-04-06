import { connectToDatabase } from './connection.js'

const importantDeadlines = [
  { title: 'Rematricula 2026/2', detail: 'Ate 05/07/2026' },
  { title: 'Horas complementares', detail: 'Envio ate 18/06/2026' },
  { title: 'Solicitacao de estagio', detail: 'Validacao em 3 dias uteis' },
]

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
    time: `Saida ${row.horario_saida}`,
    seats: row.vagas,
    meeting: row.ponto_encontro,
    vehicle: row.veiculo,
    status: row.status_carona,
    whatsapp: row.whatsapp_motorista,
    requestCount: Number(row.total_solicitacoes ?? 0),
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
      resumeFileName: '',
      desiredArea: '',
      salaryExpectation: '',
      workModel: 'Hibrido',
      preferredCity: '',
    }
  }

  return {
    course: row.curso,
    semester: row.semestre,
    resumeFileName: row.arquivo_curriculo,
    desiredArea: row.area_desejada,
    salaryExpectation: row.pretensao_salarial,
    workModel: row.modelo_trabalho,
    preferredCity: row.cidade_preferencia,
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
  const user = await getUserById(userId)

  if (!user) {
    throw new Error('Usuario nao encontrado.')
  }

  const [ridesResult, lostItemsResult, publicationsResult, moderationResult, reportsResult, profileResult, rideRequestsResult, rideInterestsResult] =
    await Promise.all([
      pool.query(
        `
          select
            c.*,
            (
              select count(*)
              from solicitacoes_caronas s
              where s.id_carona = c.id_carona
                and s.status_solicitacao = 'Pendente'
            ) as total_solicitacoes,
            coalesce(nullif(u.nome, ''), nullif(u.login_admin, ''), 'Estudante UTP') as motorista
          from caronas c
          left join usuarios u on u.id_usuario = c.id_motorista
          order by c.id_carona desc
        `,
      ),
      pool.query(
        `
          select *
          from achados_perdidos
          order by id_item desc
        `,
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
          select
            p.*,
            coalesce(nullif(u.nome, ''), nullif(u.login_admin, ''), 'Estudante UTP') as autor
          from publicacoes_mural p
          left join usuarios u on u.id_usuario = p.id_autor
          order by p.data_submissao desc, p.id_publicacao desc
        `,
      ),
      pool.query(
        `
          select *
          from denuncias
          order by data_criacao desc, id_denuncia desc
        `,
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
      pool.query(
        `
          select
            p.*,
            coalesce(nullif(solicitante.nome, ''), nullif(solicitante.login_admin, ''), 'Estudante UTP') as solicitante_nome,
            coalesce(nullif(aceitou.nome, ''), nullif(aceitou.login_admin, ''), 'Estudante UTP') as usuario_aceitou_nome
          from pedidos_caronas p
          left join usuarios solicitante on solicitante.id_usuario = p.id_solicitante
          left join usuarios aceitou on aceitou.id_usuario = p.id_usuario_aceitou
          order by p.data_criacao desc, p.id_pedido desc
        `,
      ),
      pool.query(
        `
          select
            s.*,
            coalesce(nullif(u.nome, ''), nullif(u.login_admin, ''), 'Estudante UTP') as solicitante_nome
          from solicitacoes_caronas s
          left join usuarios u on u.id_usuario = s.id_solicitante
          order by s.data_criacao desc, s.id_solicitacao desc
        `,
      ),
    ])

  const rides = ridesResult.rows.map(mapRide)
  const lostItems = lostItemsResult.rows.map(mapLostItem)
  const muralPosts = publicationsResult.rows.map(mapPublication)
  const moderationQueue = moderationResult.rows.map(mapModerationItem)
  const reports = reportsResult.rows.map(mapReport)
  const careerProfile = mapCareerProfile(profileResult.rows[0] ?? null)
  const rideRequestsInbox = rideRequestsResult.rows.map(mapRideRequest)
  const rideInterestsInbox = rideInterestsResult.rows.map(mapRideInterest)

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
    },
    rides,
    rideHotspots: buildHotspots(rides),
    lostItems,
    muralPosts,
    moderationQueue,
    reports,
    rideRequestsInbox,
    rideInterestsInbox,
    importantDeadlines,
    careerProfile,
  }
}

export async function createPublication({ userId, category, title, location, description }) {
  const pool = await connectToDatabase()

  await pool.query(
    `
      insert into publicacoes_mural (
        id_autor,
        categoria,
        titulo,
        local_empresa,
        descricao,
        status_moderacao,
        data_submissao
      )
      values ($1, $2, $3, $4, $5, 'Pendente', now())
    `,
    [userId, category, title, location || 'Central Academica UTP', description],
  )

  return getAppData(userId, 'student')
}

export async function createLostItem({
  userId,
  title,
  place,
  date,
  status,
  category,
  description,
  foundBy,
  contact,
}) {
  const pool = await connectToDatabase()

  await pool.query(
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
    `,
    [userId, title, place, date, status, category, description, foundBy, contact],
  )

  return getAppData(userId, 'student')
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
}) {
  const pool = await connectToDatabase()

  await pool.query(
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
        status_carona
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, 'Ativa')
    `,
    [userId, zone, title, departureTime, seats, meetingPoint, vehicle, whatsapp],
  )

  return getAppData(userId, 'student')
}

export async function createRideRequest({ zone, userId, whatsapp, pickupAddress }) {
  const pool = await connectToDatabase()

  await pool.query(
    `
      insert into pedidos_caronas (
        id_solicitante,
        zona_destino,
        whatsapp_solicitante,
        endereco_embarque,
        observacoes,
        status_pedido,
        data_criacao
      )
      values ($1, $2, $3, $4, $5, 'Aberto', now())
    `,
    [userId, zone, whatsapp, pickupAddress, null],
  )

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

  await pool.query(
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
    `,
    [rideId, userId, whatsapp, pickupAddress],
  )

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
    `,
    [requestId, status, status === 'Aceito' ? userId : null, status === 'Aceito' ? acceptedDriverWhatsapp : null],
  )

  return getAppData(userId, 'student')
}

export async function updatePublicationStatus(publicationId, status, userId, role) {
  const pool = await connectToDatabase()

  await pool.query(
    `
      update publicacoes_mural
      set status_moderacao = $2
      where id_publicacao = $1
    `,
    [publicationId, status],
  )

  return getAppData(userId, role)
}

export async function saveCareerProfile(userId, profile) {
  const pool = await connectToDatabase()
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
            arquivo_curriculo = $4,
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
        profile.resumeFileName,
        profile.desiredArea,
        profile.salaryExpectation,
        profile.workModel,
        profile.preferredCity,
      ],
    )
  } else {
    await pool.query(
      `
        insert into perfis_profissionais (
          id_usuario,
          curso,
          semestre,
          arquivo_curriculo,
          area_desejada,
          pretensao_salarial,
          modelo_trabalho,
          cidade_preferencia
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        userId,
        profile.course,
        profile.semester,
        profile.resumeFileName,
        profile.desiredArea,
        profile.salaryExpectation,
        profile.workModel,
        profile.preferredCity,
      ],
    )
  }

  return getAppData(userId, 'student')
}

export async function getAdminDatabaseSnapshot(userId) {
  const pool = await connectToDatabase()
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
    lostItemsResult,
    profilesResult,
    reportsResult,
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
        select id_item, id_usuario_registro, titulo, local_encontrado, data_hora, status_item, categoria
        from achados_perdidos
        order by id_item desc
      `,
    ),
    pool.query(
      `
        select id_perfil, id_usuario, curso, semestre, arquivo_curriculo, area_desejada, modelo_trabalho, cidade_preferencia
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
  ])

  return {
    totals: {
      usuarios: usersResult.rows.length,
      publicacoes_mural: publicationsResult.rows.length,
      caronas: ridesResult.rows.length,
      solicitacoes_caronas: rideRequestsResult.rows.length,
      pedidos_caronas: publicRideRequestsResult.rows.length,
      achados_perdidos: lostItemsResult.rows.length,
      perfis_profissionais: profilesResult.rows.length,
      denuncias: reportsResult.rows.length,
    },
    tables: {
      usuarios: usersResult.rows,
      publicacoes_mural: publicationsResult.rows,
      caronas: ridesResult.rows,
      solicitacoes_caronas: rideRequestsResult.rows,
      pedidos_caronas: publicRideRequestsResult.rows,
      achados_perdidos: lostItemsResult.rows,
      perfis_profissionais: profilesResult.rows,
      denuncias: reportsResult.rows,
    },
  }
}
