import type { PageView, PostStatus } from '../types/app'

export function getPageTitle(view: PageView) {
  if (view === 'home') return 'Inicio'
  if (view === 'rides') return 'Caronas'
  if (view === 'lostFound') return 'Achados e Perdidos'
  if (view === 'career') return 'Perfil Profissional'
  if (view === 'moderation') return 'Moderacao'
  if (view === 'database') return 'Logs'
  return 'Mural'
}

export function slugifyStatus(status: PostStatus) {
  if (status === 'Aprovado') return 'approved'
  if (status === 'Revisao') return 'review'
  if (status === 'Recusado') return 'refused'
  return 'pending'
}
