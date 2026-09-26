export const demoPatient = {
  id: 'demo-patient-priya',
  name: 'Priya Sharma',
  role: 'patient',
  email: 'priya.test@bsure.demo',
  password: 'Bsure@123',
  profile: {
    name: 'Priya Sharma',
    email: 'priya.test@bsure.demo',
    phone: '+91 98765 43210',
    preferredLanguage: 'Bengali',
    age: '62 years',
    id: 'B-Sure-PR-2048',
    physician: 'Dr. Mehta',
  },
  medicines: [
    {
      id: 'paracetamol', name: 'Paracetamol', dosage: '500 mg', frequency: 'Twice daily', duration: '7 days',
      timing: '8:00 AM', foodInstruction: 'After food', remainingStock: 20, status: 'due', slot: 'Morning',
      detail: '500 mg · 8:00 AM · After food',
    },
    {
      id: 'cetirizine', name: 'Cetirizine', dosage: '10 mg', frequency: 'Once daily', duration: '5 days',
      timing: '2:00 PM', foodInstruction: 'After food', remainingStock: 10, status: 'upcoming', slot: 'Afternoon',
      detail: '10 mg · 2:00 PM · After food',
    },
    {
      id: 'metformin', name: 'Metformin', dosage: '500 mg', frequency: 'Once daily', duration: '30 days',
      timing: '8:00 PM', foodInstruction: 'After food', remainingStock: 18, status: 'missed', slot: 'Night',
      detail: '500 mg · 8:00 PM · After food',
    },
  ],
  caregiver: { name: 'Anita Sharma', relationship: 'Daughter', contact: 'anita.test@bsure.demo', alertWindow: '30 minutes' },
  settings: { voiceEnabled: false, voiceLanguage: 'bn-IN', reminderMinutes: 30 },
  notifications: [
    { id: 1, type: 'Medication reminder', message: 'Your Paracetamol dose is due at 8:00 AM.', tag: 'Today', read: false },
    { id: 2, type: 'Refill reminder', message: 'You have 20 Paracetamol tablets remaining.', tag: 'Stock', read: false },
  ],
}

export const demoCaregiver = {
  id: 'demo-caregiver-anita',
  name: 'Anita Sharma',
  role: 'caregiver',
  email: 'anita.test@bsure.demo',
  password: 'Bsure@123',
  relationship: 'Daughter',
  connectedPatientId: demoPatient.id,
  connectedPatientName: demoPatient.name,
  alertWindow: '30 minutes',
}

export const demoProfiles = [demoPatient, demoCaregiver]
