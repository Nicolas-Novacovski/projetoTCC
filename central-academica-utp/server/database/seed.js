import { connectToDatabase } from './connection.js'

const demoStudent = {
  ra: '2024193227',
  birthDate: '2004-05-18',
}

const demoAdmin = {
  login: 'admin.utp',
  password: 'moderacao123',
}

async function syncSequence(pool, tableName, idColumn) {
  await pool.query(
    `
      select setval(
        pg_get_serial_sequence($1, $2),
        coalesce((select max(${idColumn}) from ${tableName}), 0) + 1,
        false
      )
    `,
    [tableName, idColumn],
  )
}

async function findOrCreateStudent(pool) {
  const existing = await pool.query(
    `
      select id_usuario
      from usuarios
      where ra = $1
      limit 1
    `,
    [demoStudent.ra],
  )

  if (existing.rowCount) {
    return existing.rows[0].id_usuario
  }

  const created = await pool.query(
    `
      insert into usuarios (ra, data_nascimento, role, is_validado, data_criacao)
      values ($1, $2::date, 'student', true, now())
      returning id_usuario
    `,
    [demoStudent.ra, demoStudent.birthDate],
  )

  return created.rows[0].id_usuario
}

async function findOrCreateAdmin(pool) {
  const existing = await pool.query(
    `
      select id_usuario
      from usuarios
      where login_admin = $1
      limit 1
    `,
    [demoAdmin.login],
  )

  if (existing.rowCount) {
    await pool.query(
      `
        update usuarios
        set senha_admin = $2,
            role = 'admin',
            is_validado = true
        where id_usuario = $1
      `,
      [existing.rows[0].id_usuario, demoAdmin.password],
    )

    return existing.rows[0].id_usuario
  }

  const created = await pool.query(
    `
      insert into usuarios (login_admin, senha_admin, role, is_validado, data_criacao)
      values ($1, $2, 'admin', true, now())
      returning id_usuario
    `,
    [demoAdmin.login, demoAdmin.password],
  )

  return created.rows[0].id_usuario
}

async function ensureCareerProfile(pool, studentId) {
  const existing = await pool.query(
    `
      select id_perfil
      from perfis_profissionais
      where id_usuario = $1
      limit 1
    `,
    [studentId],
  )

  if (existing.rowCount) {
    return
  }

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
      studentId,
      'Analise e Desenvolvimento de Sistemas',
      '4 semestre',
      'curriculo-nicolas.pdf',
      'Desenvolvimento Front-end',
      'R$ 1.800 a R$ 2.500',
      'Hibrido',
      'Curitiba',
    ],
  )
}

async function ensurePublication(pool, studentId, values) {
  const existing = await pool.query(
    `
      select id_publicacao
      from publicacoes_mural
      where titulo = $1
      limit 1
    `,
    [values.title],
  )

  if (existing.rowCount) {
    return
  }

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
      values ($1, $2, $3, $4, $5, $6, now())
    `,
    [
      studentId,
      values.category,
      values.title,
      values.location,
      values.description,
      values.status,
    ],
  )
}

async function ensureRide(pool, studentId, values) {
  const existing = await pool.query(
    `
      select id_carona
      from caronas
      where titulo = $1 and horario_saida = $2
      limit 1
    `,
    [values.title, values.time],
  )

  if (existing.rowCount) {
    return
  }

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
    [
      studentId,
      values.zone,
      values.title,
      values.time,
      values.seats,
      values.meeting,
      values.vehicle,
      values.whatsapp,
    ],
  )
}

async function ensureLostItem(pool, studentId, values) {
  const existing = await pool.query(
    `
      select id_item
      from achados_perdidos
      where titulo = $1
      limit 1
    `,
    [values.title],
  )

  if (existing.rowCount) {
    return
  }

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
    [
      studentId,
      values.title,
      values.place,
      values.date,
      values.status,
      values.category,
      values.description,
      values.foundBy,
      values.contact,
    ],
  )
}

async function ensureReport(pool, values) {
  const existing = await pool.query(
    `
      select id_denuncia
      from denuncias
      where titulo = $1
      limit 1
    `,
    [values.title],
  )

  if (existing.rowCount) {
    return
  }

  await pool.query(
    `
      insert into denuncias (titulo, detalhe, status_denuncia, data_criacao)
      values ($1, $2, $3, now())
    `,
    [values.title, values.detail, values.status],
  )
}

export async function ensureSeedData() {
  const pool = await connectToDatabase()
  await syncSequence(pool, 'usuarios', 'id_usuario')
  await syncSequence(pool, 'perfis_profissionais', 'id_perfil')
  await syncSequence(pool, 'publicacoes_mural', 'id_publicacao')
  await syncSequence(pool, 'caronas', 'id_carona')
  await syncSequence(pool, 'achados_perdidos', 'id_item')
  await syncSequence(pool, 'denuncias', 'id_denuncia')
  await syncSequence(pool, 'solicitacoes_caronas', 'id_solicitacao')

  const studentId = await findOrCreateStudent(pool)
  await findOrCreateAdmin(pool)
  await ensureCareerProfile(pool, studentId)

  await ensurePublication(pool, studentId, {
    category: 'Vaga',
    title: 'Estagio em Desenvolvimento Web',
    location: 'TechSolutions Curitiba - Hibrido',
    description:
      'Estamos buscando estagiarios apaixonados por React e Node.js para um plano de desenvolvimento com possibilidade de efetivacao.',
    status: 'Aprovado',
  })

  await ensurePublication(pool, studentId, {
    category: 'Evento',
    title: 'Semana Academica de Tecnologia',
    location: 'Auditorio Principal - 15/04/2026',
    description:
      'Palestras, oficinas praticas e networking com certificado de horas complementares.',
    status: 'Aprovado',
  })

  await ensurePublication(pool, studentId, {
    category: 'Grupo de estudo',
    title: 'Grupo de estudos de IA aplicada',
    location: 'Laboratorio Maker',
    description:
      'Encontros quinzenais para discutir IA aplicada, prototipos e estudos de caso.',
    status: 'Revisao',
  })

  await ensureRide(pool, studentId, {
    zone: 'Boqueirao',
    title: 'Boqueirao -> Campus UTP',
    time: '18:10',
    seats: '2 vagas',
    meeting: 'Terminal do Boqueirao',
    vehicle: 'Onix prata',
    whatsapp: '(41) 99991-1001',
  })

  await ensureRide(pool, studentId, {
    zone: 'Pinheirinho',
    title: 'Pinheirinho -> Campus UTP',
    time: '18:25',
    seats: '3 vagas',
    meeting: 'Rua Winston Churchill',
    vehicle: 'HB20 branco',
    whatsapp: '(41) 99991-1002',
  })

  await ensureRide(pool, studentId, {
    zone: 'Centro',
    title: 'Centro -> Campus UTP',
    time: '19:00',
    seats: '1 vaga',
    meeting: 'Praca Rui Barbosa',
    vehicle: 'Sandero vermelho',
    whatsapp: '(41) 99991-1003',
  })

  await ensureLostItem(pool, studentId, {
    title: 'Mochila preta com caderno azul',
    place: 'Bloco C - Laboratorio 2',
    date: 'Hoje, 11:40',
    status: 'Encontrado na recepcao',
    category: 'Mochilas',
    description:
      'Mochila preta de tecido com um caderno universitario azul e estojo pequeno no bolso frontal.',
    foundBy: 'Recepcao do bloco C',
    contact: 'apoio.academico@utp.br',
  })

  await ensureLostItem(pool, studentId, {
    title: 'Carteirinha de estudante',
    place: 'Patio principal',
    date: 'Hoje, 09:20',
    status: 'Aguardando retirada',
    category: 'Documentos',
    description:
      'Carteirinha em nome de Beatriz Souza, encontrada proxima aos bancos centrais do patio.',
    foundBy: 'Equipe de apoio ao aluno',
    contact: 'secretaria@utp.br',
  })

  await ensureReport(pool, {
    title: 'Publicacao de vaga falsa no mural',
    detail:
      'O utilizador publicou uma vaga de estagio a exigir pagamento previo de taxa. Por favor, verifiquem.',
    status: 'Aberta',
  })

  await ensureReport(pool, {
    title: 'Conduta perigosa',
    detail:
      'Motorista estava a circular em excesso de velocidade no estacionamento hoje de manha.',
    status: 'Resolvida',
  })
}
