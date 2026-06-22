import { Router } from 'express'
import {
  closeRide,
  createJobApplication,
  createLostItem,
  createRideInterest,
  createRide,
  createRideRequest,
  createPublication,
  deleteRideRequest,
  getAdminLogs,
  getAppData,
  loginAdmin,
  loginStudent,
  markLostItemRecovered,
  recordAuditLog,
  saveCareerProfile,
  updateRide,
  updateRideRequest,
  updateRideRequestStatus,
  updatePublicationStatus,
  deletePublication,
  deleteRide,
  createReport,
  updateReportStatus,
  deleteReport,
} from '../database/app-service.js'
import { getDatabaseConfig } from '../database/connection.js'

export const router = Router()

router.get('/health', (_request, response) => {
  response.json({
    status: 'ok',
    service: 'central-academica-backend',
    timestamp: new Date().toISOString(),
  })
})

router.get('/database', (_request, response) => {
  response.json({
    connection: {
      status: 'connected',
      message: 'Conexao ativa com o banco PostgreSQL.',
    },
    config: getDatabaseConfig(),
  })
})

router.post('/auth/login', async (request, response) => {
  const { mode, ra, birthDate, login, password } = request.body

  const user =
    mode === 'admin'
      ? await loginAdmin(login, password)
      : await loginStudent(String(ra ?? ''), String(birthDate ?? ''))

  if (!user) {
    await recordAuditLog({
      action: 'LOGIN_FALHA',
      entity: 'usuarios',
      detail: { mode, identifier: mode === 'admin' ? login : String(ra ?? '') },
    })

    return response.status(401).json({
      status: 'error',
      message: 'Credenciais invalidas.',
    })
  }

  await recordAuditLog({
    userId: user.id,
    action: 'LOGIN_SUCESSO',
    entity: 'usuarios',
    entityId: user.id,
    detail: { mode: user.role },
  })

  const data = await getAppData(user.id, user.role)

  return response.json({
    status: 'ok',
    user,
    data,
  })
})

router.get('/app-data', async (request, response) => {
  const userId = Number(request.query.userId)
  const role = request.query.role === 'admin' ? 'admin' : 'student'

  if (!Number.isFinite(userId)) {
    return response.status(400).json({
      status: 'error',
      message: 'userId invalido.',
    })
  }

  const data = await getAppData(userId, role)
  return response.json(data)
})

router.get('/admin/logs', async (request, response) => {
  const userId = Number(request.query.userId)

  if (!Number.isFinite(userId)) {
    return response.status(400).json({
      status: 'error',
      message: 'userId invalido.',
    })
  }

  const data = await getAdminLogs(userId)
  await recordAuditLog({
    userId,
    action: 'LOGS_AUDITORIA_CONSULTADOS',
    entity: 'logs_auditoria',
    detail: { area: 'admin/logs' },
  })

  return response.json({
    status: 'ok',
    data,
  })
})

router.post('/publications', async (request, response) => {
  const { userId, role, category, title, location, contactEmail, description } = request.body

  if (!userId || !category || !title || !description) {
    return response.status(400).json({
      status: 'error',
      message: 'Campos obrigatorios nao enviados.',
    })
  }

  const data = await createPublication({
    userId: Number(userId),
    role,
    category,
    title,
    location,
    contactEmail,
    description,
  })

  return response.status(201).json({
    status: 'ok',
    data,
  })
})

router.post('/applications', async (request, response) => {
  const { userId, publicationId, studentName } = request.body

  if (!userId || !publicationId) {
    return response.status(400).json({
      status: 'error',
      message: 'Dados invalidos para registrar interesse na vaga.',
    })
  }

  try {
    const application = await createJobApplication({
      userId: Number(userId),
      publicationId: Number(publicationId),
      studentName: studentName || 'Estudante UTP',
    })

    return response.status(201).json({
      status: 'ok',
      application,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nao foi possivel registrar interesse na vaga.'
    const expectedError = [
      'Vaga nao encontrada',
      'Informe um e-mail',
      'Usuario nao encontrado',
    ].some((text) => message.includes(text))

    return response.status(expectedError ? 400 : 500).json({
      status: 'error',
      message: expectedError ? message : 'Nao foi possivel registrar interesse na vaga.',
      details: message,
    })
  }
})

router.post('/lost-items', async (request, response) => {
  const { userId, role, title, place, category, description, foundBy } = request.body

  if (!userId || !title || !place || !category || !description || !foundBy) {
    return response.status(400).json({
      status: 'error',
      message: 'Campos obrigatorios do item nao enviados.',
    })
  }

  const data = await createLostItem({
    userId: Number(userId),
    role: role || 'student',
    title,
    place,
    category,
    description,
    foundBy,
  })

  return response.status(201).json({
    status: 'ok',
    data,
  })
})

router.post('/rides', async (request, response) => {
  const { userId, zone, title, departureTime, seats, meetingPoint, vehicle, whatsapp, weekdays } = request.body

  if (!userId || !zone || !title || !departureTime || !meetingPoint || !vehicle || !whatsapp || !Array.isArray(weekdays) || weekdays.length === 0) {
    return response.status(400).json({
      status: 'error',
      message: 'Campos obrigatorios da carona nao enviados.',
    })
  }

  const data = await createRide({
    userId: Number(userId),
    zone,
    title,
    departureTime,
    seats,
    meetingPoint,
    vehicle,
    whatsapp,
    weekdays,
  })

  return response.status(201).json({
    status: 'ok',
    data,
  })
})

router.post('/ride-requests', async (request, response) => {
  const { userId, zone, whatsapp, pickupAddress, weekdays } = request.body

  if (!userId || !zone || !whatsapp || !pickupAddress || !Array.isArray(weekdays) || weekdays.length === 0) {
    return response.status(400).json({
      status: 'error',
      message: 'Campos obrigatorios da solicitacao nao enviados.',
    })
  }

  const data = await createRideRequest({
    zone,
    userId: Number(userId),
    whatsapp,
    pickupAddress,
    weekdays,
  })

  return response.status(201).json({
    status: 'ok',
    data,
  })
})

router.patch('/rides/:id/close', async (request, response) => {
  const rideId = Number(request.params.id)
  const { userId } = request.body

  if (!rideId || !userId) {
    return response.status(400).json({
      status: 'error',
      message: 'Dados invalidos para encerrar a carona.',
    })
  }

  const data = await closeRide(rideId, Number(userId))

  return response.json({
    status: 'ok',
    data,
  })
})

router.patch('/rides/:id', async (request, response) => {
  const rideId = Number(request.params.id)
  const { userId, zone, title, departureTime, seats, meetingPoint, vehicle, whatsapp, weekdays } = request.body

  if (!rideId || !userId || !zone || !title || !departureTime || !meetingPoint || !vehicle || !whatsapp || !Array.isArray(weekdays) || weekdays.length === 0) {
    return response.status(400).json({
      status: 'error',
      message: 'Dados invalidos para editar a carona.',
    })
  }

  const data = await updateRide({
    rideId,
    userId: Number(userId),
    zone,
    title,
    departureTime,
    seats,
    meetingPoint,
    vehicle,
    whatsapp,
    weekdays,
  })

  return response.json({
    status: 'ok',
    data,
  })
})


router.delete('/rides/:id', async (request, response) => {
  const rideId = Number(request.params.id)
  const userId = Number(request.query.userId)

  if (!rideId || !userId) {
    return response.status(400).json({
      status: 'error',
      message: 'Dados invalidos para excluir a carona.',
    })
  }

  try {
    await deleteRide(rideId, userId)

    return response.json({
      status: 'ok',
      message: 'Carona excluida com sucesso.',
    })
  } catch (error) {
    console.error('Erro ao deletar carona:', error)
    return response.status(500).json({
      status: 'error',
      message: 'Erro interno ao excluir a carona.',
    })
  }
})

router.post('/rides/:id/interests', async (request, response) => {
  const rideId = Number(request.params.id)
  const { userId, whatsapp, pickupAddress } = request.body

  if (!rideId || !userId || !whatsapp || !pickupAddress) {
    return response.status(400).json({
      status: 'error',
      message: 'Dados invalidos para registrar interesse na carona.',
    })
  }

  const data = await createRideInterest({
    rideId,
    userId: Number(userId),
    whatsapp,
    pickupAddress,
  })

  return response.status(201).json({
    status: 'ok',
    data,
  })
})

router.patch('/ride-requests/:id', async (request, response) => {
  const requestId = Number(request.params.id)
  const { userId, zone, whatsapp, pickupAddress, weekdays } = request.body

  if (!requestId || !userId || !zone || !whatsapp || !pickupAddress || !Array.isArray(weekdays) || weekdays.length === 0) {
    return response.status(400).json({
      status: 'error',
      message: 'Dados invalidos para editar a solicitacao.',
    })
  }

  const data = await updateRideRequest({
    requestId,
    userId: Number(userId),
    zone,
    whatsapp,
    pickupAddress,
    weekdays,
  })

  return response.json({
    status: 'ok',
    data,
  })
})

router.patch('/ride-requests/:id/status', async (request, response) => {
  const requestId = Number(request.params.id)
  const { userId, status } = request.body

  if (!requestId || !userId || !['Aceito', 'Aberto'].includes(status)) {
    return response.status(400).json({
      status: 'error',
      message: 'Dados invalidos para atualizar a solicitacao.',
    })
  }

  const data = await updateRideRequestStatus(requestId, Number(userId), status)

  return response.json({
    status: 'ok',
    data,
  })
})

router.delete('/ride-requests/:id', async (request, response) => {
  const requestId = Number(request.params.id)
  const userId = Number(request.query.userId)
  const role = request.query.role

  if (!requestId || !userId) {
    return response.status(400).json({
      status: 'error',
      message: 'Dados invalidos para excluir a solicitacao.',
    })
  }

  const data = await deleteRideRequest(requestId, userId, role)

  return response.json({
    status: 'ok',
    data,
  })
})

router.patch('/lost-items/:id/recovered', async (request, response) => {
  const itemId = Number(request.params.id)
  const { userId, role } = request.body

  if (!itemId || !userId || role !== 'admin') {
    return response.status(400).json({
      status: 'error',
      message: 'Dados invalidos para marcar o item como recuperado.',
    })
  }

  const data = await markLostItemRecovered(itemId, Number(userId), 'admin')

  return response.json({
    status: 'ok',
    data,
  })
})

router.patch('/publications/:id/status', async (request, response) => {
  const publicationId = Number(request.params.id)
  const { status, userId, role } = request.body

  if (!['Pendente', 'Aprovado', 'Revisao', 'Recusado'].includes(status)) {
    return response.status(400).json({
      status: 'error',
      message: 'Status de moderacao invalido.',
    })
  }

  const data = await updatePublicationStatus(
    publicationId,
    status,
    Number(userId),
    role === 'admin' ? 'admin' : 'student',
  )

  return response.json({
    status: 'ok',
    data,
  })
})

router.delete('/publications/:id', async (request, response) => {
  const publicationId = Number(request.params.id)

  try {
    await deletePublication(publicationId)

    return response.json({
      status: 'ok',
      message: 'Publicacao excluida permanentemente.',
    })
  } catch (error) {
    console.error('Erro ao deletar publicacao:', error)
    return response.status(500).json({
      status: 'error',
      message: 'Erro interno ao excluir a publicacao.',
    })
  }
})

router.put('/career-profile/:userId', async (request, response) => {
  const userId = Number(request.params.userId)
  
  try {
    if (!request.body) {
      throw new Error('Nenhum dado recebido no corpo da requisição.')
    }

    const dadosLimpos = { ...request.body }
    
    
    Object.keys(dadosLimpos).forEach(key => {
      if (typeof dadosLimpos[key] === 'string') {
        const valorOriginal = dadosLimpos[key].trim()
        const valorLower = valorOriginal.toLowerCase()
        
        if (
          valorOriginal === '' || 
          valorLower.includes('informado') || 
          valorLower.startsWith('selecione') ||
          valorLower === 'null'
        ) {
          dadosLimpos[key] = null
        }
      }
    })
    
    const data = await saveCareerProfile(userId, dadosLimpos)
    
    return response.json({
      status: 'ok',
      data,
    })
  } catch (error) {
    console.error('ERRO AO SALVAR PERFIL:', error)
    return response.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Erro interno ao salvar o perfil.',
    })
  }
})
router.post('/reports', async (request, response) => {
  const { userId, title, detail } = request.body

  if (!userId || !title || !detail) {
    return response.status(400).json({
      status: 'error',
      message: 'Campos obrigatorios da denuncia nao enviados.',
    })
  }

  const data = await createReport({
    userId: Number(userId),
    title,
    detail,
  })

  return response.status(201).json({
    status: 'ok',
    data,
  })
})

router.patch('/reports/:id/status', async (request, response) => {
  const reportId = Number(request.params.id)
  const { status, userId, role } = request.body

  if (!['Aberta', 'Resolvida'].includes(status)) {
    return response.status(400).json({
      status: 'error',
      message: 'Status de denuncia invalido.',
    })
  }

  const data = await updateReportStatus(
    reportId,
    status,
    Number(userId),
    role === 'admin' ? 'admin' : 'student',
  )

  return response.json({
    status: 'ok',
    data,
  })
})

router.delete('/reports/:id', async (request, response) => {
  const reportId = Number(request.params.id)
  const userId = Number(request.query.userId)
  const role = request.query.role

  if (!reportId || !userId || role !== 'admin') {
    return response.status(400).json({
      status: 'error',
      message: 'Dados invalidos ou sem permissao para excluir a denuncia.',
    })
  }

  try {
    const data = await deleteReport(reportId, userId, role)

    return response.json({
      status: 'ok',
      data,
    })
  } catch (error) {
    console.error('Erro ao deletar denuncia:', error)
    return response.status(500).json({
      status: 'error',
      message: 'Erro interno ao excluir a denuncia.',
    })
  }
})
