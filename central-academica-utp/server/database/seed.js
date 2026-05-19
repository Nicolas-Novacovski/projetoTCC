import { connectToDatabase } from './connection.js'

const demoStudent = {
  name: 'Nicolas',
  ra: '2024193227',
  birthDate: '2004-05-18',
}

const demoAdmin = {
  name: 'Moderacao UTP',
  login: 'admin.utp',
  password: 'moderacao123',
}

const secretaryEmail = 'secretaria@utp.br'

async function ensureDatabaseSchema(pool) {
  await pool.query(`
    create table if not exists usuarios (
      id_usuario serial primary key,
      nome varchar(120),
      ra varchar(20) unique,
      data_nascimento date,
      login_admin varchar(120) unique,
      senha_admin varchar(255),
      role varchar(20) not null default 'student',
      is_validado boolean not null default false,
      data_criacao timestamp without time zone not null default now()
    )
  `)

  await pool.query(`
    create table if not exists publicacoes_mural (
      id_publicacao serial primary key,
      id_autor integer references usuarios(id_usuario) on delete set null,
      categoria varchar(60) not null,
      titulo varchar(160) not null,
      local_empresa varchar(160),
      email_contato varchar(160),
      descricao text not null,
      status_moderacao varchar(30) not null default 'Pendente',
      data_submissao timestamp without time zone not null default now()
    )
  `)

  await pool.query(`
    create table if not exists caronas (
      id_carona serial primary key,
      id_motorista integer references usuarios(id_usuario) on delete set null,
      zona_destino varchar(50) not null,
      titulo varchar(160) not null,
      horario_saida varchar(20) not null,
      vagas varchar(40) not null,
      ponto_encontro varchar(160) not null,
      veiculo varchar(120) not null,
      whatsapp_motorista varchar(30) not null,
      status_carona varchar(30) not null default 'Ativa'
    )
  `)

  await pool.query(`
    create table if not exists solicitacoes_caronas (
      id_solicitacao serial primary key,
      id_carona integer references caronas(id_carona) on delete cascade,
      id_solicitante integer references usuarios(id_usuario) on delete set null,
      whatsapp_solicitante varchar(30) not null,
      endereco_embarque varchar(255) not null,
      status_solicitacao varchar(30) not null default 'Pendente',
      data_criacao timestamp without time zone not null default now()
    )
  `)

  await pool.query(`
    create table if not exists pedidos_caronas (
      id_pedido serial primary key,
      id_solicitante integer references usuarios(id_usuario) on delete set null,
      zona_destino varchar(50) not null,
      endereco_embarque varchar(255) not null,
      whatsapp_solicitante varchar(30) not null,
      dias_semana text[],
      observacoes text,
      status_pedido varchar(30) not null default 'Aberto',
      id_usuario_aceitou integer references usuarios(id_usuario) on delete set null,
      motorista_aceitou_whatsapp varchar(30),
      data_criacao timestamp without time zone not null default now()
    )
  `)

  await pool.query(`
    create table if not exists achados_perdidos (
      id_item serial primary key,
      id_usuario_registro integer references usuarios(id_usuario) on delete set null,
      titulo varchar(160) not null,
      local_encontrado varchar(160) not null,
      data_hora varchar(60) not null,
      status_item varchar(80) not null default 'Perdido',
      categoria varchar(60) not null,
      descricao text not null,
      encontrado_por varchar(120) not null,
      contato_retirada varchar(160) not null default 'secretaria@utp.br'
    )
  `)

  await pool.query(`
    create table if not exists perfis_profissionais (
      id_perfil serial primary key,
      id_usuario integer references usuarios(id_usuario) on delete cascade,
      curso varchar(120) not null,
      semestre varchar(40) not null,
      arquivo_curriculo varchar(255),
      area_desejada varchar(120),
      pretensao_salarial varchar(80),
      modelo_trabalho varchar(40),
      cidade_preferencia varchar(120)
    )
  `)

  await pool.query(`
    create table if not exists candidaturas_vagas (
      id_candidatura serial primary key,
      id_publicacao integer references publicacoes_mural(id_publicacao) on delete cascade,
      id_usuario integer references usuarios(id_usuario) on delete set null,
      email_aluno varchar(160) not null,
      email_contato_vaga varchar(160) not null,
      curriculo varchar(255),
      status_email varchar(40) not null default 'Pendente',
      data_criacao timestamp without time zone not null default now()
    )
  `)

  await pool.query(`
    create table if not exists denuncias (
      id_denuncia serial primary key,
      titulo varchar(160) not null,
      detalhe text not null,
      status_denuncia varchar(40) not null default 'Aberta',
      data_criacao timestamp without time zone not null default now()
    )
  `)

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

  await pool.query(`alter table usuarios add column if not exists nome varchar(120)`)
  await pool.query(`alter table usuarios add column if not exists data_criacao timestamp without time zone not null default now()`)
  await pool.query(`alter table publicacoes_mural add column if not exists email_contato varchar(160)`)
  await pool.query(`alter table perfis_profissionais add column if not exists email_contato varchar(160)`)
  await pool.query(`alter table candidaturas_vagas add column if not exists data_criacao timestamp without time zone not null default now()`)
  await pool.query(`alter table candidaturas_vagas add column if not exists status_email varchar(40) not null default 'Pendente'`)
  await pool.query(`alter table solicitacoes_caronas add column if not exists data_criacao timestamp without time zone not null default now()`)
  await pool.query(`alter table pedidos_caronas add column if not exists data_criacao timestamp without time zone not null default now()`)
  await pool.query(`alter table denuncias add column if not exists data_criacao timestamp without time zone not null default now()`)
  await pool.query(`alter table logs_auditoria add column if not exists acao varchar(120) not null default 'ACAO_NAO_INFORMADA'`)
  await pool.query(`alter table logs_auditoria add column if not exists entidade varchar(80) not null default 'sistema'`)
  await pool.query(`alter table logs_auditoria add column if not exists id_entidade integer`)
  await pool.query(`alter table logs_auditoria add column if not exists detalhe jsonb`)
  await pool.query(`alter table logs_auditoria add column if not exists data_criacao timestamp without time zone not null default now()`)
  await pool.query(`alter table pedidos_caronas add column if not exists motorista_aceitou_whatsapp varchar(30)`)
  await pool.query(`alter table caronas add column if not exists dias_semana text[]`)
  await pool.query(`alter table pedidos_caronas add column if not exists dias_semana text[]`)
  await pool.query(`alter table caronas alter column dias_semana drop not null`)
  await pool.query(`alter table pedidos_caronas alter column dias_semana drop not null`)
  await pool.query(`alter table achados_perdidos alter column status_item set default 'Perdido'`)
  await pool.query(`alter table achados_perdidos alter column contato_retirada set default 'secretaria@utp.br'`)

  await pool.query(`
    do $$
    begin
      if exists (
        select 1
        from information_schema.columns
        where table_name = 'caronas'
          and column_name = 'dias_semana'
          and udt_name <> '_text'
      ) then
        execute '
          alter table caronas
          alter column dias_semana drop default
        ';
        execute '
          alter table caronas
          alter column dias_semana type text[]
          using case
            when dias_semana is null or btrim(dias_semana::text) = '''' then null
            else regexp_split_to_array(trim(both ''"'' from dias_semana::text), ''\\s*,\\s*'')
          end
        ';
      end if;
    end
    $$;
  `)

  await pool.query(`
    do $$
    begin
      if exists (
        select 1
        from information_schema.columns
        where table_name = 'pedidos_caronas'
          and column_name = 'dias_semana'
          and udt_name <> '_text'
      ) then
        execute '
          alter table pedidos_caronas
          alter column dias_semana drop default
        ';
        execute '
          alter table pedidos_caronas
          alter column dias_semana type text[]
          using case
            when dias_semana is null or btrim(dias_semana::text) = '''' then null
            else regexp_split_to_array(trim(both ''"'' from dias_semana::text), ''\\s*,\\s*'')
          end
        ';
      end if;
    end
    $$;
  `)

  await pool.query(`
    update pedidos_caronas
    set dias_semana = regexp_split_to_array(observacoes, '\\s*,\\s*')
    where (dias_semana is null or cardinality(dias_semana) = 0)
      and observacoes is not null
      and btrim(observacoes) <> ''
      and observacoes ~* 'Segunda|Terca|Terça|Quarta|Quinta|Sexta'
  `)

  await pool.query(`
    update pedidos_caronas
    set dias_semana = null
    where dias_semana is not null
      and array_length(dias_semana, 1) = 1
      and lower(coalesce(dias_semana[1], '')) in ('nao informado', 'não informado')
  `)

  await pool.query(`
    update caronas
    set dias_semana = null
    where dias_semana is not null
      and array_length(dias_semana, 1) = 1
      and lower(coalesce(dias_semana[1], '')) in ('nao informado', 'não informado')
  `)
}

async function ensureDatabaseIndexes(pool) {
  await pool.query(`create index if not exists idx_usuarios_ra on usuarios (ra)`)
  await pool.query(`create index if not exists idx_usuarios_login_admin on usuarios (login_admin)`)
  await pool.query(`create index if not exists idx_publicacoes_status_data on publicacoes_mural (status_moderacao, data_submissao desc)`)
  await pool.query(`create index if not exists idx_publicacoes_autor on publicacoes_mural (id_autor)`)
  await pool.query(`create index if not exists idx_candidaturas_vagas_usuario on candidaturas_vagas (id_usuario, data_criacao desc)`)
  await pool.query(`create index if not exists idx_candidaturas_vagas_publicacao on candidaturas_vagas (id_publicacao, data_criacao desc)`)
  await pool.query(`create index if not exists idx_caronas_status_data on caronas (status_carona, id_carona desc)`)
  await pool.query(`create index if not exists idx_caronas_motorista on caronas (id_motorista, id_carona desc)`)
  await pool.query(`create index if not exists idx_caronas_dias_semana on caronas using gin (dias_semana)`)
  await pool.query(`create index if not exists idx_solicitacoes_caronas_lookup on solicitacoes_caronas (id_carona, status_solicitacao, data_criacao desc)`)
  await pool.query(`create index if not exists idx_solicitacoes_caronas_solicitante on solicitacoes_caronas (id_solicitante, data_criacao desc)`)
  await pool.query(`create index if not exists idx_pedidos_caronas_status_data on pedidos_caronas (status_pedido, data_criacao desc)`)
  await pool.query(`create index if not exists idx_pedidos_caronas_solicitante on pedidos_caronas (id_solicitante, data_criacao desc)`)
  await pool.query(`create index if not exists idx_pedidos_caronas_dias_semana on pedidos_caronas using gin (dias_semana)`)
  await pool.query(`create index if not exists idx_perfis_profissionais_usuario on perfis_profissionais (id_usuario, id_perfil desc)`)
  await pool.query(`create index if not exists idx_achados_perdidos_data on achados_perdidos (id_item desc)`)
  await pool.query(`create index if not exists idx_denuncias_data on denuncias (data_criacao desc, id_denuncia desc)`)
  await pool.query(`create index if not exists idx_logs_auditoria_data on logs_auditoria (data_criacao desc, id_log desc)`)
  await pool.query(`create index if not exists idx_logs_auditoria_usuario on logs_auditoria (id_usuario, data_criacao desc)`)
  await pool.query(`create index if not exists idx_logs_auditoria_entidade on logs_auditoria (entidade, id_entidade)`)
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
    await pool.query(
      `
        update usuarios
        set nome = $2,
            role = 'student',
            is_validado = true
        where id_usuario = $1
      `,
      [existing.rows[0].id_usuario, demoStudent.name],
    )

    return existing.rows[0].id_usuario
  }

  const created = await pool.query(
    `
      insert into usuarios (nome, ra, data_nascimento, role, is_validado, data_criacao)
      values ($1, $2, $3::date, 'student', true, now())
      returning id_usuario
    `,
    [demoStudent.name, demoStudent.ra, demoStudent.birthDate],
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
        set nome = $2,
            senha_admin = $3,
            role = 'admin',
            is_validado = true
        where id_usuario = $1
      `,
      [existing.rows[0].id_usuario, demoAdmin.name, demoAdmin.password],
    )

    return existing.rows[0].id_usuario
  }

  const created = await pool.query(
    `
      insert into usuarios (nome, login_admin, senha_admin, role, is_validado, data_criacao)
      values ($1, $2, $3, 'admin', true, now())
      returning id_usuario
    `,
    [demoAdmin.name, demoAdmin.login, demoAdmin.password],
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
        email_contato,
        area_desejada,
        pretensao_salarial,
        modelo_trabalho,
        cidade_preferencia
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `,
    [
      studentId,
      'Analise e Desenvolvimento de Sistemas',
      '4 semestre',
      'curriculo-nicolas.pdf',
      'nicolas@aluno.utp.br',
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
        email_contato,
        descricao,
        status_moderacao,
        data_submissao
      )
      values ($1, $2, $3, $4, $5, $6, $7, now())
    `,
    [
      studentId,
      values.category,
      values.title,
      values.location,
      values.contactEmail ?? secretaryEmail,
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
        dias_semana,
        status_carona
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Ativa')
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
      values.weekdays ?? ['Segunda', 'Quarta', 'Sexta'],
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
      secretaryEmail,
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
  await ensureDatabaseSchema(pool)
  await ensureDatabaseIndexes(pool)

  const existingUsersResult = await pool.query(
    `
      select count(*)::int as total
      from usuarios
    `,
  )

  if ((existingUsersResult.rows[0]?.total ?? 0) > 0) {
    return
  }

  await syncSequence(pool, 'usuarios', 'id_usuario')
  await syncSequence(pool, 'perfis_profissionais', 'id_perfil')
  await syncSequence(pool, 'publicacoes_mural', 'id_publicacao')
  await syncSequence(pool, 'caronas', 'id_carona')
  await syncSequence(pool, 'achados_perdidos', 'id_item')
  await syncSequence(pool, 'denuncias', 'id_denuncia')
  await syncSequence(pool, 'solicitacoes_caronas', 'id_solicitacao')
  await syncSequence(pool, 'pedidos_caronas', 'id_pedido')
  await syncSequence(pool, 'candidaturas_vagas', 'id_candidatura')

  const studentId = await findOrCreateStudent(pool)
  await findOrCreateAdmin(pool)
  await ensureCareerProfile(pool, studentId)

  await ensurePublication(pool, studentId, {
    category: 'Vaga',
    title: 'Estagio em Desenvolvimento Web',
    location: 'TechSolutions Curitiba - Hibrido',
    contactEmail: 'rh@techsolutions.example',
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
    weekdays: ['Segunda', 'Terca', 'Quarta'],
  })

  await ensureRide(pool, studentId, {
    zone: 'Pinheirinho',
    title: 'Pinheirinho -> Campus UTP',
    time: '18:25',
    seats: '3 vagas',
    meeting: 'Rua Winston Churchill',
    vehicle: 'HB20 branco',
    whatsapp: '(41) 99991-1002',
    weekdays: ['Segunda', 'Quarta', 'Sexta'],
  })

  await ensureRide(pool, studentId, {
    zone: 'Centro',
    title: 'Centro -> Campus UTP',
    time: '19:00',
    seats: '1 vaga',
    meeting: 'Praca Rui Barbosa',
    vehicle: 'Sandero vermelho',
    whatsapp: '(41) 99991-1003',
    weekdays: ['Terca', 'Quinta'],
  })

  await ensureLostItem(pool, studentId, {
    title: 'Mochila preta com caderno azul',
    place: 'Bloco C - Laboratorio 2',
    date: 'Hoje, 11:40',
    status: 'Perdido',
    category: 'Mochilas',
    description:
      'Mochila preta de tecido com um caderno universitario azul e estojo pequeno no bolso frontal.',
    foundBy: 'Recepcao do bloco C',
  })

  await ensureLostItem(pool, studentId, {
    title: 'Carteirinha de estudante',
    place: 'Patio principal',
    date: 'Hoje, 09:20',
    status: 'Perdido',
    category: 'Documentos',
    description:
      'Carteirinha em nome de Beatriz Souza, encontrada proxima aos bancos centrais do patio.',
    foundBy: 'Equipe de apoio ao aluno',
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
