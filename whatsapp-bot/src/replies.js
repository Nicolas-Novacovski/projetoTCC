const secretaryEmail = 'secretaria@utp.br'
const lostFoundPlace = 'casinha no estacionamento, proximo a entrada dos blocos A e B'

export const menuOptions = [
  {
    id: 'option_lost_found',
    key: '1',
    label: 'Achados e Perdidos',
    description: 'Local de retirada e regras para itens encontrados.',
  },
  {
    id: 'option_rides',
    key: '2',
    label: 'Caronas',
    description: 'Como solicitar ou oferecer caronas entre alunos.',
  },
  {
    id: 'option_mural',
    key: '3',
    label: 'Mural Academico',
    description: 'Vagas, eventos, grupos de estudo e comunicados.',
  },
  {
    id: 'option_secretary',
    key: '4',
    label: 'Secretaria',
    description: 'Contato, retirada de itens e orientacoes gerais.',
  },
  {
    id: 'option_team',
    key: '5',
    label: 'Falar com a equipe',
    description: 'Encaminhe uma duvida para a Central Academica.',
  },
]

const menuMessage = `*Ola! Sou o assistente da Central Academica UTP.*

Escolha uma opcao para continuar:

*[ 1 ]* Achados e Perdidos
Local de retirada e regras para itens encontrados.

*[ 2 ]* Caronas
Solicitar ou oferecer caronas entre alunos.

*[ 3 ]* Mural Academico
Vagas, eventos, grupos de estudo e comunicados.

*[ 4 ]* Secretaria
Contato, retirada de itens e orientacoes gerais.

*[ 5 ]* Falar com a equipe
Encaminhar uma duvida para atendimento.

Responda com o numero da opcao.`

const replies = {
  lostFound: `*Achados e Perdidos*

Os itens encontrados podem ser retirados APENAS PELOS DONOS.

Local de retirada: ${lostFoundPlace}.

Contato da secretaria: ${secretaryEmail}.`,

  rides: `*Caronas*

Na plataforma, voce pode solicitar uma carona ou oferecer vagas no seu carro.

A combinacao de horario, ponto de encontro e contato acontece diretamente entre os alunos.`,

  mural: `*Mural Academico*

No mural voce encontra vagas, eventos, grupos de estudo e comunicados.

As publicacoes enviadas pelos alunos passam por moderacao antes de aparecerem para todos.`,

  secretary: `*Secretaria*

E-mail: ${secretaryEmail}

Para retirada de itens achados, compareca a ${lostFoundPlace}.

Lembre-se: a retirada e permitida apenas pelo dono do item.`,

  team: `*Falar com a equipe*

Envie sua duvida por aqui em uma mensagem objetiva.

Assim que possivel, alguem da Central Academica ou secretaria podera orientar o atendimento.`,
}

const optionLabels = Object.fromEntries(menuOptions.map((option) => [option.key, option.label]))

function normalizeMessage(message) {
  return String(message ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function getBotReply(message, botName = 'Assistente Central Academica UTP') {
  const optionReply = getOptionReply(message)

  if (optionReply) {
    return optionReply.text
  }

  const normalizedMessage = normalizeMessage(message)

  if (!normalizedMessage || ['oi', 'ola', 'menu', 'inicio', 'start'].includes(normalizedMessage)) {
    return getMenuMessage(botName)
  }

  return `Nao entendi sua mensagem.

${getMenuMessage(botName)}`
}

export function getMenuMessage(botName = 'Assistente Central Academica UTP') {
  return menuMessage.replace('assistente da Central Academica UTP', botName)
}

export function getOptionReply(message) {
  const normalizedMessage = normalizeMessage(message)

  if (['1', 'option_lost_found', 'achados', 'achados e perdidos', 'perdidos', 'item', 'itens'].some((term) => normalizedMessage.includes(term))) {
    return { key: '1', label: optionLabels['1'], text: replies.lostFound }
  }

  if (['2', 'option_rides', 'carona', 'caronas'].some((term) => normalizedMessage.includes(term))) {
    return { key: '2', label: optionLabels['2'], text: replies.rides }
  }

  if (['3', 'option_mural', 'mural', 'vaga', 'vagas', 'evento', 'eventos', 'grupo'].some((term) => normalizedMessage.includes(term))) {
    return { key: '3', label: optionLabels['3'], text: replies.mural }
  }

  if (['4', 'option_secretary', 'secretaria', 'email', 'e-mail', 'retirada'].some((term) => normalizedMessage.includes(term))) {
    return { key: '4', label: optionLabels['4'], text: replies.secretary }
  }

  if (['5', 'option_team', 'atendente', 'equipe', 'humano', 'pessoa', 'ajuda'].some((term) => normalizedMessage.includes(term))) {
    return { key: '5', label: optionLabels['5'], text: replies.team }
  }

  return null
}
