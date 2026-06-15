import type { Dispatch, SetStateAction } from 'react'

export type UserRole = 'student' | 'admin'
export type PageView = 'home' | 'rides' | 'lostFound' | 'career' | 'mural' | 'moderation' | 'database'
export type LoginMode = 'student' | 'admin'
export type PostStatus = 'Pendente' | 'Aprovado' | 'Revisao'

export type AppUser = { id: number; role: UserRole; name: string }

export type DashboardStats = {
  ridesCount: number
  lostItemsCount: number
  muralCount: number
  pendingModerationCount: number
  reportsCount: number
  approvedPublicationsCount: number
  jobInterestsCount: number
  sentEmailsCount: number
  recoveredLostItemsCount: number
  closedRidesCount: number
}

export type Deadline = {
  title: string
  detail: string
  description: string
  action: string
  channel: string
}

export type ModerationPost = {
  id: number
  title: string
  category: string
  author: string
  status: PostStatus
  submittedAt: string
  description: string
  contactEmail: string
  location: string
}

export type RideOffer = {
  id: number
  driverId: number
  zone: string
  title: string
  driver: string
  time: string
  seats: string
  meeting: string
  vehicle: string
  status: string
  whatsapp: string
  requestCount: number
  weekdays: string
}

export type RideHotspot = { id: string; name: string; detail: string }

export type LostItem = {
  id: number
  title: string
  place: string
  date: string
  status: string
  category: string
  description: string
  foundBy: string
  contact: string
}

export type LostItemForm = {
  title: string
  place: string
  date: string
  category: string
  description: string
  foundBy: string
}

export type PublishForm = { category: string; title: string; location: string; contactEmail: string; description: string }

export type RideForm = {
  zone: string
  title: string
  departureTime: string
  seats: string
  meetingPoint: string
  vehicle: string
  whatsapp: string
  weekdays: string[]
}

export type RideRequestForm = { whatsapp: string; pickupAddress: string; weekdays?: string[] }

export type CareerProfile = {
  course: string
  semester: string
  contactEmail: string
  desiredArea: string
  salaryExpectation: string
  workModel: string
  preferredCity: string
}

export type MuralPost = {
  id: number
  category: string
  title: string
  subtitle: string
  tag: string
  description: string
  status: PostStatus
  submittedAt: string
  author: string
  contactEmail: string
  button: string | null
  meta: string[] | null
}

export type ApplicationStatus = 'available' | 'submitted'

export type JobInterest = {
  postId: number
  emailStatus: string
  contactEmail: string
  createdAt: string
}

export type Report = { id: number; title: string; detail: string; status: string; createdAt: string }

export type RideRequest = {
  id: number
  requesterId: number
  requesterName: string
  zone: string
  requesterWhatsapp: string
  pickupAddress: string
  weekdays: string
  notes: string | null
  status: string
  acceptedByUserId: number | null
  acceptedByName: string | null
  acceptedByWhatsapp: string | null
  createdAt: string
}

export type RideInterest = {
  id: number
  rideId: number
  requesterId: number
  requesterName: string
  requesterWhatsapp: string
  pickupAddress: string
  status: string
  createdAt: string
}

export type AppData = {
  user: AppUser
  dashboard: DashboardStats
  rides: RideOffer[]
  rideHotspots: RideHotspot[]
  lostItems: LostItem[]
  muralPosts: MuralPost[]
  appliedPostIds: number[]
  jobInterests: JobInterest[]
  moderationQueue: ModerationPost[]
  reports: Report[]
  rideRequestsInbox: RideRequest[]
  rideInterestsInbox: RideInterest[]
  importantDeadlines: Deadline[]
  careerProfile: CareerProfile
}

export type AdminDatabaseSnapshot = {
  totals: Record<string, number>
  tables: {
    usuarios: Array<Record<string, unknown>>
    publicacoes_mural: Array<Record<string, unknown>>
    caronas: Array<Record<string, unknown>>
    solicitacoes_caronas: Array<Record<string, unknown>>
    pedidos_caronas: Array<Record<string, unknown>>
    candidaturas_vagas: Array<Record<string, unknown>>
    achados_perdidos: Array<Record<string, unknown>>
    perfis_profissionais: Array<Record<string, unknown>>
    denuncias: Array<Record<string, unknown>>
    logs_auditoria: Array<Record<string, unknown>>
  }
}

export type CareerProfileSetter = Dispatch<SetStateAction<CareerProfile>>
