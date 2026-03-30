import { Router } from 'express'
import {
  closeRide,
  createRide,
  createRideRequest,
  createPublication,
  getAdminDatabaseSnapshot,
  getAppData,
  loginAdmin,
  loginStudent,
  saveCareerProfile,
  updateRideRequestStatus,
  updatePublicationStatus,
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
      message: 'Conexao ativa com o banco PostgreSQL no Neon.',
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
    return response.status(401).json({
      status: 'error',
      message: 'Credenciais invalidas.',
    })
  }

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

router.get('/admin/database-snapshot', async (request, response) => {
  const userId = Number(request.query.userId)

  if (!Number.isFinite(userId)) {
    return response.status(400).json({
      status: 'error',
      message: 'userId invalido.',
    })
  }

  const data = await getAdminDatabaseSnapshot(userId)
  return response.json({
    status: 'ok',
    data,
  })
})

router.post('/publications', async (request, response) => {
  const { userId, category, title, location, description } = request.body

  if (!userId || !category || !title || !description) {
    return response.status(400).json({
      status: 'error',
      message: 'Campos obrigatorios nao enviados.',
    })
  }

  const data = await createPublication({
    userId: Number(userId),
    category,
    title,
    location,
    description,
  })

  return response.status(201).json({
    status: 'ok',
    data,
  })
})

router.post('/rides', async (request, response) => {
  const { userId, zone, title, departureTime, seats, meetingPoint, vehicle, whatsapp } = request.body

  if (!userId || !zone || !title || !departureTime || !seats || !meetingPoint || !vehicle || !whatsapp) {
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
  })

  return response.status(201).json({
    status: 'ok',
    data,
  })
})

router.post('/rides/:id/requests', async (request, response) => {
  const rideId = Number(request.params.id)
  const { userId, whatsapp, pickupAddress } = request.body

  if (!rideId || !userId || !whatsapp || !pickupAddress) {
    return response.status(400).json({
      status: 'error',
      message: 'Campos obrigatorios da solicitacao nao enviados.',
    })
  }

  const data = await createRideRequest({
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

router.patch('/ride-requests/:id/status', async (request, response) => {
  const requestId = Number(request.params.id)
  const { userId, status } = request.body

  if (!requestId || !userId || !['Aceita', 'Recusada'].includes(status)) {
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

router.patch('/publications/:id/status', async (request, response) => {
  const publicationId = Number(request.params.id)
  const { status, userId, role } = request.body

  if (!['Pendente', 'Aprovado', 'Revisao'].includes(status)) {
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

router.put('/career-profile/:userId', async (request, response) => {
  const userId = Number(request.params.userId)
  const data = await saveCareerProfile(userId, request.body)

  return response.json({
    status: 'ok',
    data,
  })
})
