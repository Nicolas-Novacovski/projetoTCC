import type { CareerProfile, LostItemForm } from '../types/app'

export const studentCredentials = { ra: '2024193227', birthDate: '2004-05-18' }

export const adminCredentials = { login: 'admin.utp', password: 'moderacao123' }

export const emptyCareerProfile: CareerProfile = {
  course: '',
  semester: '',
  contactEmail: '',
  desiredArea: '',
  salaryExpectation: '',
  workModel: 'Hibrido',
  preferredCity: '',
}

export const emptyLostItemForm: LostItemForm = {
  title: '',
  place: '',
  date: '',
  category: 'Documentos',
  description: '',
  foundBy: '',
}
