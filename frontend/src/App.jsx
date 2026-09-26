import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { demoCaregiver, demoPatient, demoProfiles } from '../../test/testProfiles.js'

const navItems = ['Dashboard', 'Medicines', 'Scan Prescription', 'Adherence', 'Caregiver']
const indianLanguages = [
  { label: 'English', value: 'en-IN' },
  { label: 'Hindi', value: 'hi-IN' },
  { label: 'Bengali', value: 'bn-IN' },
  { label: 'Marathi', value: 'mr-IN' },
  { label: 'Telugu', value: 'te-IN' },
  { label: 'Tamil', value: 'ta-IN' },
  { label: 'Gujarati', value: 'gu-IN' },
  { label: 'Kannada', value: 'kn-IN' },
  { label: 'Malayalam', value: 'ml-IN' },
  { label: 'Punjabi', value: 'pa-IN' },
  { label: 'Odia', value: 'or-IN' },
  { label: 'Assamese', value: 'as-IN' },
  { label: 'Urdu', value: 'ur-IN' },
]

const reminderMessages = {
  'en-IN': 'It is time to take Paracetamol, five hundred milligrams, after food.',
  'hi-IN': 'खाने के बाद पैरासिटामोल पाँच सौ मिलीग्राम लेने का समय हो गया है।',
  'bn-IN': 'খাবারের পরে প্যারাসিটামল পাঁচশো মিলিগ্রাম খাওয়ার সময় হয়েছে।',
  'mr-IN': 'जेवणानंतर पॅरासिटामॉल पाचशे मिलिग्रॅम घेण्याची वेळ झाली आहे.',
  'te-IN': 'భోజనం తర్వాత పారాసెటమాల్ ఐదు వందల మిల్లీగ్రాములు తీసుకునే సమయం వచ్చింది.',
  'ta-IN': 'உணவுக்குப் பிறகு பாராசிட்டமால் ஐநூறு மில்லிகிராம் எடுத்துக்கொள்ள வேண்டிய நேரம்.',
  'gu-IN': 'જમ્યા પછી પેરાસિટામોલ પાંચસો મિલિગ્રામ લેવાનો સમય થયો છે.',
  'kn-IN': 'ಊಟದ ನಂತರ ಪ್ಯಾರಾಸಿಟಮಾಲ್ ಐದು ನೂರು ಮಿಲಿಗ್ರಾಂ ತೆಗೆದುಕೊಳ್ಳುವ ಸಮಯವಾಗಿದೆ.',
  'ml-IN': 'ഭക്ഷണത്തിന് ശേഷം പാരസെറ്റമോൾ അഞ്ഞൂറ് മില്ലിഗ്രാം കഴിക്കേണ്ട സമയമായി.',
  'pa-IN': 'ਖਾਣੇ ਤੋਂ ਬਾਅਦ ਪੈਰਾਸੀਟਾਮੋਲ ਪੰਜ ਸੌ ਮਿਲੀਗ੍ਰਾਮ ਲੈਣ ਦਾ ਸਮਾਂ ਹੋ ਗਿਆ ਹੈ।',
  'or-IN': 'ଖାଇବା ପରେ ପାରାସିଟାମଲ ପାଞ୍ଚଶହ ମିଲିଗ୍ରାମ ନେବାର ସମୟ ହୋଇଛି।',
  'as-IN': 'ভাত খোৱাৰ পিছত পেৰাচিটামল পাঁচশ মিলিগ্ৰাম লোৱাৰ সময় হৈছে।',
  'ur-IN': 'کھانے کے بعد پیراسیٹامول پانچ سو ملی گرام لینے کا وقت ہو گیا ہے۔',
}

const findVoice = (voices, language) => voices.find((voice) => voice.lang.toLowerCase() === language.toLowerCase())
  || voices.find((voice) => voice.lang.split('-')[0].toLowerCase() === language.split('-')[0].toLowerCase())

const defaultProfile = {
  name: '',
  email: '',
  phone: '',
  preferredLanguage: 'English',
  age: '',
  id: '',
  physician: '',
}

const defaultAuth = {
  isLoggedIn: false,
  user: null,
}

const defaultSettings = {
  voiceEnabled: false,
  voiceLanguage: 'en-IN',
  reminderMinutes: 30,
}

const getPatientDataKey = (id) => `bsure-patient-data-${id}`
const getActivePageKey = (id) => `bsure-active-page-${id}`

const getPatientData = (profile) => ({
  profile: profile.profile || defaultProfile,
  medicines: profile.medicines || [],
  caregiver: profile.caregiver || null,
  settings: profile.settings || defaultSettings,
  notifications: profile.notifications || [],
  doseHistory: profile.doseHistory || [],
})

const readStoredSession = () => {
  try {
    const storedSession = JSON.parse(localStorage.getItem('bsure-session'))
    return storedSession?.isLoggedIn && storedSession.user?.id ? storedSession : defaultAuth
  } catch {
    return defaultAuth
  }
}

const readStoredPatientData = (session) => {
  if (!session?.isLoggedIn || !session.user) return {}

  const patientId = session.user.role === 'caregiver' ? session.user.connectedPatientId : session.user.id
  if (!patientId) return {}

  try {
    const storedData = localStorage.getItem(getPatientDataKey(patientId))
    if (storedData) return JSON.parse(storedData)
  } catch {
    return {}
  }

  if (session.user.role === 'caregiver') return getPatientData(demoPatient)

  const demoProfile = demoProfiles.find((profile) => profile.id === patientId && profile.role === 'patient')
  if (demoProfile) return getPatientData(demoProfile)

  try {
    const account = JSON.parse(localStorage.getItem('bsure-accounts') || '[]')
      .find((savedAccount) => savedAccount.id === patientId)
    return getPatientData(account?.data || { profile: account?.user })
  } catch {
    return {}
  }
}

const readStoredActivePage = (session) => {
  if (!session?.isLoggedIn || !session.user?.id) return 'Dashboard'
  try {
    const page = localStorage.getItem(getActivePageKey(session.user.id))
    return navItems.includes(page) ? page : 'Dashboard'
  } catch {
    return 'Dashboard'
  }
}

function BrandMark() {
  return (
    <svg viewBox="0 0 64 64" className="brand-mark" aria-hidden="true">
      <rect x="16" y="8" width="11" height="48" rx="5.5" fill="currentColor" opacity="0.96" />
      <rect x="24" y="8" width="18" height="16" rx="8" fill="currentColor" opacity="0.96" />
      <rect x="24" y="40" width="18" height="16" rx="8" fill="currentColor" opacity="0.96" />
      <path d="M22 34.5 L29 41.5 L42 26.5" fill="none" stroke="#ebf8f0" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M41.8 24.5C44.9 23.8 47.2 26.1 46.8 29.2C46.4 32.1 43.5 33.6 41.2 32.8" fill="none" stroke="#ebf8f0" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
    </svg>
  )
}

function App() {
  const [appView, setAppView] = useState(() => readStoredSession().isLoggedIn ? 'app' : 'landing')
  const [activePage, setActivePage] = useState(() => readStoredActivePage(readStoredSession()))
  const [authMode, setAuthMode] = useState('login')
  const [forgotContact, setForgotContact] = useState('')
  const [forgotError, setForgotError] = useState('')
  const [forgotSubmitted, setForgotSubmitted] = useState(false)
  const [session, setSession] = useState(readStoredSession)
  const [patientDataLoaded, setPatientDataLoaded] = useState(() => readStoredSession().user?.role === 'patient' && readStoredSession().isLoggedIn)
  const [userProfile, setUserProfile] = useState(() => readStoredPatientData(readStoredSession()).profile || defaultProfile)
  const [medicines, setMedicines] = useState(() => deduplicateMedicines(readStoredPatientData(readStoredSession()).medicines || []))
  const [caregiver, setCaregiver] = useState(() => readStoredPatientData(readStoredSession()).caregiver || null)
  const [notifications, setNotifications] = useState(() => readStoredPatientData(readStoredSession()).notifications || [])
  const [settings, setSettings] = useState(() => readStoredPatientData(readStoredSession()).settings || defaultSettings)
  const [doseHistory, setDoseHistory] = useState(() => readStoredPatientData(readStoredSession()).doseHistory || [])
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileCamera, setProfileCamera] = useState({ open: false, stream: null, error: '' })
  const [profilePhotoDraft, setProfilePhotoDraft] = useState('')
  const [selectedMedicine, setSelectedMedicine] = useState(null)
  const [toast, setToast] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [scanState, setScanState] = useState('idle')
  const [isSubmittingPrescription, setIsSubmittingPrescription] = useState(false)
  const [isSubmittingMedicines, setIsSubmittingMedicines] = useState(false)
  const [ocrResults, setOcrResults] = useState([
    {
      id: 'ocr-1',
      name: 'Paracetamol',
      dosage: '500 mg',
      frequency: 'Twice daily',
      duration: '5 days',
      timing: '8:00 AM',
      foodInstruction: 'After food',
    },
    {
      id: 'ocr-2',
      name: 'Cetirizine',
      dosage: '10 mg',
      frequency: 'Once daily',
      duration: '5 days',
      timing: '9:00 PM',
      foodInstruction: 'At night',
    },
  ])
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loginErrors, setLoginErrors] = useState({})
  const [signupErrors, setSignupErrors] = useState({})
  const [authError, setAuthError] = useState('')
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    rememberMe: true,
  })
  const [cameraState, setCameraState] = useState({
    cameraOpen: false,
    stream: null,
    photo: null,
    permissionError: '',
  })
  const [voiceStatus, setVoiceStatus] = useState('Voice not enabled')
  const [voiceError, setVoiceError] = useState('')
  const [availableVoices, setAvailableVoices] = useState([])
  const [selectedVoiceName, setSelectedVoiceName] = useState('')
  const cameraVideoRef = useRef(null)
  const fileInputRef = useRef(null)
  const medicineSubmissionInProgress = useRef(false)
  const profilePhotoInputRef = useRef(null)
  const profileCameraVideoRef = useRef(null)

  useEffect(() => {
    localStorage.setItem('bsure-session', JSON.stringify(session))
  }, [session])

  useEffect(() => {
    if (!session.isLoggedIn || !session.user?.id) return
    localStorage.setItem(getActivePageKey(session.user.id), activePage)
  }, [session, activePage])

  useEffect(() => {
    if (!patientDataLoaded || !session.user?.id || session.user.role !== 'patient') return
    localStorage.setItem(getPatientDataKey(session.user.id), JSON.stringify({
      profile: userProfile,
      medicines: deduplicateMedicines(medicines),
      caregiver,
      settings,
      notifications,
      doseHistory,
    }))
  }, [patientDataLoaded, session, userProfile, medicines, caregiver, settings, notifications, doseHistory])

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(''), 2600)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!profileCamera.open || !profileCamera.stream || !profileCameraVideoRef.current) return undefined
    const video = profileCameraVideoRef.current
    video.srcObject = profileCamera.stream
    video.play().catch(() => undefined)
    return () => {
      video.srcObject = null
    }
  }, [profileCamera.open, profileCamera.stream])

  useEffect(() => {
    const updateVoices = () => {
      const voices = window.speechSynthesis?.getVoices?.() || []
      setAvailableVoices(voices)
      const selectedLanguageVoice = findVoice(voices, settings.voiceLanguage)
      setSelectedVoiceName(selectedLanguageVoice?.name || '')
    }

    updateVoices()
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, [settings.voiceLanguage])

  const unreadNotificationCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  )

  const nextMedication = useMemo(() => {
    const items = [...medicines].sort((a, b) => (a.status === 'taken' ? 1 : 0) - (b.status === 'taken' ? 1 : 0))
    const relevant = items.find((medicine) => !['taken', 'skipped'].includes(medicine.status))
    return relevant || null
  }, [medicines])

  const adherenceData = useMemo(() => {
    const total = medicines.length
    const taken = medicines.filter((medicine) => medicine.status === 'taken').length
    const skipped = medicines.filter((medicine) => medicine.status === 'skipped').length
    const missed = medicines.filter((medicine) => medicine.status === 'missed').length
    const pending = medicines.filter((medicine) => ['due', 'upcoming'].includes(medicine.status)).length
    const percentage = total ? Math.round((taken / total) * 100) : 0
    return { total, taken, skipped, missed, pending, percentage }
  }, [medicines])

  const weeklyHistory = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date()
      date.setDate(date.getDate() - 6 + index)
      const dayDoses = doseHistory.filter((dose) => new Date(dose.occurredAt).toDateString() === date.toDateString())
      const value = dayDoses.length === 0 ? '—' : dayDoses.every((dose) => dose.status === 'taken') ? '✓' : '!'
      return { day: date.toLocaleDateString(undefined, { weekday: 'short' }), value }
    })
  }, [doseHistory])

  const timelineGroups = useMemo(() => {
    const groups = ['Morning', 'Afternoon', 'Night']
    return groups.map((group) => ({
      label: group,
      items: medicines
        .filter((medicine) => medicine.slot === group)
        .map((medicine) => {
          const state = medicine.status === 'taken' ? 'taken' : medicine.status === 'skipped' ? 'skipped' : medicine.status === 'missed' ? 'missed' : 'upcoming'
          return {
            ...medicine,
            state,
            stateLabel: medicine.status === 'taken' ? 'Taken' : medicine.status === 'skipped' ? 'Skipped' : medicine.status === 'missed' ? 'Missed' : 'Upcoming',
          }
        }),
    }))
  }, [medicines])

  const speakReminder = (message, requireEnabled = true) => {
    if (!('speechSynthesis' in window) || (requireEnabled && !settings.voiceEnabled)) return

    const voices = window.speechSynthesis.getVoices()
    const chosenVoice = findVoice(voices, settings.voiceLanguage)

    if (!chosenVoice) {
      setVoiceError("Voice playback for this language isn't available on your device. Please choose another available voice or install a supported language voice.")
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(message)
    utterance.voice = chosenVoice
    utterance.lang = settings.voiceLanguage
    utterance.rate = 1
    utterance.pitch = 1
    utterance.onend = () => setVoiceStatus(`Reminder spoken in ${settings.voiceLanguage}`)
    utterance.onerror = () => setVoiceError('There was a problem playing the voice reminder. Please try again.')
    window.speechSynthesis.speak(utterance)
    setVoiceStatus(`Playing reminder in ${settings.voiceLanguage}`)
    setVoiceError('')
  }

  const testVoice = () => {
    if (!('speechSynthesis' in window)) {
      setVoiceError('Voice playback is not supported by this browser.')
      return
    }
    if (!findVoice(window.speechSynthesis.getVoices(), settings.voiceLanguage)) {
      setVoiceStatus('')
      setVoiceError("Voice playback for this language isn't available on your device.")
      return
    }
    const reminder = reminderMessages[settings.voiceLanguage]
    speakReminder(reminder, false)
  }

  const showToast = (message) => {
    setToast(message)
  }

  const updateMedicineStatus = (medicineId, nextStatus, successMessage) => {
    const changedMedicine = medicines.find((medicine) => medicine.id === medicineId)
    setMedicines((previous) =>
      previous.map((medicine) => {
        if (medicine.id !== medicineId) return medicine
        const normalized = nextStatus === 'taken' ? 'taken' : nextStatus === 'skipped' ? 'skipped' : 'missed'
        return {
          ...medicine,
          status: normalized,
          detail: `${medicine.dosage} · ${medicine.timing} · ${medicine.foodInstruction}`,
        }
      }),
    )

    if (changedMedicine) {
      setDoseHistory((previous) => [{
        id: `${medicineId}-${Date.now()}`,
        medicineId,
        medicineName: changedMedicine.name,
        status: nextStatus,
        occurredAt: new Date().toISOString(),
      }, ...previous])
      setNotifications((previous) => [{
        id: Date.now(),
        type: nextStatus === 'taken' ? 'Dose taken' : 'Dose skipped',
        message: `${changedMedicine.name} was marked as ${nextStatus}.`,
        tag: 'Today',
        read: false,
      }, ...previous])
    }

    if (successMessage) {
      showToast(successMessage)
    }

    if (nextStatus === 'skipped') {
      const next = medicines.find((medicine) => medicine.id !== medicineId && !['taken', 'skipped'].includes(medicine.status))
      if (next) {
        showToast(`${next.name} is now the next medication.`)
      }
    }
  }

  const handleNotificationRead = (notificationId) => {
    setNotifications((previous) =>
      previous.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification,
      ),
    )
  }

  const handleMarkAllNotificationsRead = () => {
    if (unreadNotificationCount === 0) return
    setNotifications((previous) => previous.map((notification) => ({ ...notification, read: true })))
  }

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return URL.createObjectURL(file)
    })
    setScanState('uploaded')
    showToast('Prescription selected')
  }

  const openScanFilePicker = () => {
    fileInputRef.current?.click()
  }

  const normalizePrescriptionFile = (file) => {
    if (!file) return null
    if (file instanceof File) return file
    if (file instanceof Blob) {
      const fileName = file.name || 'prescription-image.png'
      const mimeType = file.type || 'image/png'
      return new File([file], fileName, { type: mimeType })
    }
    return null
  }

  const handleContinueScan = async () => {
    const imageFile = normalizePrescriptionFile(selectedFile)
    if (!imageFile) {
      showToast('Please select a prescription image first.')
      return
    }

    if (isSubmittingPrescription) return

    setIsSubmittingPrescription(true)
    setScanState('processing')

    try {
      const formData = new FormData()
      formData.append('image', imageFile)

      const response = await fetch('http://localhost:8000/post/prescription/', {
        method: 'POST',
        body: formData,
      })

      let payload = null
      try {
        payload = await response.json()
      } catch {
        payload = null
      }

      if (!response.ok) {
        const detail = payload?.detail || 'Prescription analysis failed.'
        showToast(detail)
        setScanState('uploaded')
        return
      }

      const medicines = Array.isArray(payload?.medicines) ? payload.medicines : []
      if (!medicines.length) {
        showToast('No medicines were detected in this prescription.')
        setScanState('uploaded')
        return
      }

      const mappedResults = medicines.map((medicine, index) => ({
        id: `ocr-${Date.now()}-${index}`,
        name: medicine.medicine_name || '',
        dosage: medicine.dosage || '',
        frequency: medicine.frequency || '',
        duration: medicine.duration || '',
        timing: medicine.timing || '',
        foodInstruction: medicine.food_instruction || medicine.foodInstruction || '',
      }))

      setOcrResults(mappedResults)
      setScanState('results')
      showToast('Medicines identified')
    } catch (error) {
      console.error('Prescription upload failed:', error)
      showToast('Unable to connect to the prescription service on port 8000. Please ensure the backend is running and CORS is allowed.')
      setScanState('uploaded')
    } finally {
      setIsSubmittingPrescription(false)
    }
  }

  const updateOcrField = (id, field, value) => {
    setOcrResults((previous) =>
      previous.map((medicine) => (medicine.id === id ? { ...medicine, [field]: value } : medicine)),
    )
  }

  const handleAddMedicines = async () => {
    const newMedicines = ocrResults.map((medicine, index) => ({
      id: `${medicine.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${index}`,
      name: medicine.name,
      dosage: medicine.dosage,
      frequency: medicine.frequency,
      duration: medicine.duration,
      timing: medicine.timing,
      foodInstruction: medicine.foodInstruction,
      remainingStock: 14 + index,
      status: 'due',
      slot: medicine.timing.includes('PM') ? 'Afternoon' : medicine.timing.includes('AM') ? 'Morning' : 'Night',
      detail: `${medicine.dosage} · ${medicine.timing} · ${medicine.foodInstruction}`,
    })).filter((medicine) => medicine.name)
    const existingNames = new Set(medicines.map(medicineNameKey).filter(Boolean))
    const medicinesToSubmit = newMedicines.filter((medicine) => !existingNames.has(medicineNameKey(medicine)))
    const updatedMedicines = deduplicateMedicines([...medicines, ...newMedicines])

    setMedicines((previous) => [...previous, ...newMedicines])
    setNotifications((previous) => [
      {
        id: Date.now(),
        type: 'Prescription added',
        message: `Your prescription was processed and added to your medicine list.`,
        tag: 'New',
        read: false,
      },
      ...previous,
    ])
    try {
      const results = await Promise.all(medicinesToSubmit.map(submitMedicine))
      const failures = results.filter((result) => !result.ok)
      if (failures.length) {
        const firstFailure = failures[0]
        showToast(`${failures.length} medicine(s) saved locally; backend submission failed: ${firstFailure.message}`)
      } else if (medicinesToSubmit.length) {
        showToast('Prescription added successfully')
      } else {
        showToast('Medicine list updated; no new medicines needed submission.')
      }
    } finally {
      setScanState('idle')
      setSelectedFile(null)
      setPreviewUrl('')
      setOcrResults([
        {
          id: 'ocr-1',
          name: 'Paracetamol',
          dosage: '500 mg',
          frequency: 'Twice daily',
          duration: '5 days',
          timing: '8:00 AM',
          foodInstruction: 'After food',
        },
        {
          id: 'ocr-2',
          name: 'Cetirizine',
          dosage: '10 mg',
          frequency: 'Once daily',
          duration: '5 days',
          timing: '9:00 PM',
          foodInstruction: 'At night',
        },
      ])
      setActivePage('Dashboard')
      medicineSubmissionInProgress.current = false
      setIsSubmittingMedicines(false)
    }
  }

  const openCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState((previous) => ({ ...previous, permissionError: 'This browser does not support camera access. Please upload a prescription instead.' }))
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      setCameraState({ cameraOpen: true, stream, photo: null, permissionError: '' })
      setScanState('camera')
      setTimeout(() => {
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = stream
          cameraVideoRef.current.play().catch(() => undefined)
        }
      }, 100)
    } catch (error) {
      setCameraState({ cameraOpen: false, stream: null, photo: null, permissionError: "We couldn't access your camera. Please check your browser permissions or upload a prescription instead." })
      setScanState('idle')
    }
  }

  const capturePhoto = async () => {
    if (!cameraVideoRef.current) return

    const video = cameraVideoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const context = canvas.getContext('2d')
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageUrl = canvas.toDataURL('image/png')
    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/png')
    })
    const imageFile = new File([blob], 'camera-capture.png', { type: 'image/png' })

    setCameraState((previous) => ({ ...previous, photo: imageUrl, cameraOpen: false, stream: previous.stream }))
    setSelectedFile(imageFile)
    setPreviewUrl(imageUrl)
    setScanState('uploaded')
    if (cameraState.stream) {
      cameraState.stream.getTracks().forEach((track) => track.stop())
    }
  }

  const closeCamera = () => {
    if (cameraState.stream) {
      cameraState.stream.getTracks().forEach((track) => track.stop())
    }
    setCameraState({ cameraOpen: false, stream: null, photo: null, permissionError: '' })
    setScanState('idle')
  }

  const handleLogin = (event) => {
    event.preventDefault()
    const email = loginForm.email.trim().toLowerCase()
    const errors = {
      email: email ? '' : 'Please enter your email.',
      password: loginForm.password ? '' : 'Please enter your password.',
    }
    setLoginErrors(errors)
    setAuthError('')

    if (errors.email || errors.password) {
      return
    }

    const demoAccount = demoProfiles.find((profile) => profile.email.toLowerCase() === email && profile.password === loginForm.password)
    const registeredAccounts = JSON.parse(localStorage.getItem('bsure-accounts') || '[]')
    const registeredAccount = registeredAccounts.find((account) => account.email.toLowerCase() === email && account.password === loginForm.password)
    const account = demoAccount || registeredAccount

    if (!account) {
      setAuthError('Email or password is incorrect.')
      return
    }

    const user = account.role === 'patient' && account.profile ? account.profile : account.user
    const patientId = account.role === 'caregiver' ? account.connectedPatientId : account.id
    const fallbackData = account.role === 'caregiver' ? getPatientData(demoPatient) : account.medicines ? getPatientData(account) : account.data
    const storedData = localStorage.getItem(getPatientDataKey(patientId))
    const patientData = storedData ? JSON.parse(storedData) : fallbackData

    setUserProfile(patientData.profile || user || defaultProfile)
    setMedicines(deduplicateMedicines(patientData.medicines || []))
    setCaregiver(patientData.caregiver || null)
    setSettings(patientData.settings || defaultSettings)
    setNotifications(patientData.notifications || [])
    setDoseHistory(patientData.doseHistory || [])
    setPatientDataLoaded(account.role === 'patient')
    const authenticatedSession = {
      isLoggedIn: true,
      user: {
        id: account.id,
        name: account.name || user?.name,
        email: account.email,
        role: account.role,
        connectedPatientId: account.connectedPatientId,
        connectedPatientName: account.connectedPatientName,
      },
    }
    localStorage.setItem('bsure-session', JSON.stringify(authenticatedSession))
    setSession(authenticatedSession)
    setAppView('app')
    setActivePage(account.role === 'caregiver' ? 'Caregiver' : 'Dashboard')
    showToast(account.role === 'caregiver' ? 'Caregiver demo opened.' : 'Welcome back!')
  }

  const handleSignUp = (event) => {
    event.preventDefault()
    const errors = {
      name: authForm.name.trim() ? '' : 'Please enter your full name.',
      email: authForm.email.trim() ? '' : 'Please enter your email.',
      password: authForm.password ? '' : 'Please create a password.',
      confirmPassword: authForm.confirmPassword ? '' : 'Please confirm your password.',
    }
    if (!errors.password && !errors.confirmPassword && authForm.password !== authForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.'
    }
    setSignupErrors(errors)

    if (Object.values(errors).some(Boolean)) {
      return
    }

    const email = authForm.email.trim().toLowerCase()
    const user = {
      ...defaultProfile,
      name: authForm.name,
      email,
      preferredLanguage: 'English',
      id: `B-Sure-${Date.now().toString().slice(-6)}`,
    }
    const account = { id: user.id, name: user.name, email, password: authForm.password, role: 'patient', user, data: {
      profile: user,
      medicines: [],
      caregiver: null,
      settings: defaultSettings,
      notifications: [],
      doseHistory: [],
    } }
    const registeredAccounts = JSON.parse(localStorage.getItem('bsure-accounts') || '[]')
    localStorage.setItem('bsure-accounts', JSON.stringify([...registeredAccounts.filter((item) => item.email !== email), account]))
    setUserProfile(user)
    setMedicines([])
    setCaregiver(null)
    setSettings(defaultSettings)
    setNotifications([])
    setDoseHistory([])
    setPatientDataLoaded(true)
    const authenticatedSession = { isLoggedIn: true, user: { id: user.id, name: user.name, email: user.email, role: 'patient' } }
    localStorage.setItem('bsure-session', JSON.stringify(authenticatedSession))
    setSession(authenticatedSession)
    setAuthForm({ name: '', email: '', password: '', confirmPassword: '' })
    setSignupErrors({})
    setAppView('app')
    setActivePage('Dashboard')
    showToast('Account created successfully')
  }

  const handleLogout = () => {
    if (session.user?.id) {
      localStorage.removeItem(getActivePageKey(session.user.id))
    }
    localStorage.setItem('bsure-session', JSON.stringify(defaultAuth))
    setSession(defaultAuth)
    setAppView('landing')
    setActivePage('Dashboard')
    showToast('You have been signed out.')
  }

  const closeProfile = () => {
    profileCamera.stream?.getTracks().forEach((track) => track.stop())
    setProfileCamera({ open: false, stream: null, error: '' })
    setProfilePhotoDraft('')
    setProfileOpen(false)
  }

  const cancelProfileCamera = () => {
    profileCamera.stream?.getTracks().forEach((track) => track.stop())
    setProfileCamera((current) => ({ ...current, open: false, stream: null }))
  }

  const loadProfilePhoto = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('The image could not be read.'))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error('The selected file is not a supported image.'))
      image.onload = () => {
        const scale = Math.min(1, 512 / Math.max(image.width, image.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(image.width * scale))
        canvas.height = Math.max(1, Math.round(image.height * scale))
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      image.src = reader.result
    }
    reader.readAsDataURL(file)
  })

  const handleProfilePhotoUpload = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setProfileCamera((current) => ({ ...current, error: 'Choose a JPG, PNG, or WEBP image.' }))
      return
    }

    try {
      const avatarUrl = await loadProfilePhoto(file)
      setUserProfile((current) => ({ ...current, avatarUrl }))
      setProfilePhotoDraft('')
      setProfileCamera((current) => ({ ...current, error: '' }))
    } catch {
      setProfileCamera((current) => ({ ...current, error: 'The selected image could not be opened. Please choose another photo.' }))
    }
  }

  const openProfileCamera = async () => {
    setProfileCamera((current) => ({ ...current, error: '' }))
    if (!navigator.mediaDevices?.getUserMedia) {
      setProfileCamera({ open: false, stream: null, error: "Camera access isn't available. You can upload a photo instead." })
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      setProfilePhotoDraft('')
      setProfileCamera({ open: true, stream, error: '' })
    } catch {
      setProfileCamera({ open: false, stream: null, error: "Camera access isn't available. You can upload a photo instead." })
    }
  }

  const captureProfilePhoto = () => {
    const video = profileCameraVideoRef.current
    if (!video?.videoWidth || !video.videoHeight) {
      setProfileCamera((current) => ({ ...current, error: 'The camera is not ready yet. Please try again.' }))
      return
    }

    const scale = Math.min(1, 512 / Math.max(video.videoWidth, video.videoHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale))
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale))
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
    const photo = canvas.toDataURL('image/jpeg', 0.82)
    profileCamera.stream?.getTracks().forEach((track) => track.stop())
    setProfilePhotoDraft(photo)
    setProfileCamera({ open: false, stream: null, error: '' })
  }

  const useProfilePhotoDraft = () => {
    if (!profilePhotoDraft) return
    setUserProfile((current) => ({ ...current, avatarUrl: profilePhotoDraft }))
    setProfilePhotoDraft('')
    setProfileCamera({ open: false, stream: null, error: '' })
  }

  const handleForgotPassword = (event) => {
    event.preventDefault()
    const contact = forgotContact.trim()
    if (!contact) {
      setForgotError('Please enter your email or phone number.')
      return
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)
    const isPhone = /^\+?[\d\s()-]{7,}$/.test(contact)
    if (!isEmail && !isPhone) {
      setForgotError('Enter a valid email or phone number.')
      return
    }

    setForgotError('')
    setForgotSubmitted(true)
  }

  const returnToLogin = () => {
    setAuthMode('login')
    setForgotContact('')
    setForgotError('')
    setForgotSubmitted(false)
    setAppView('login')
  }

  const navigateFromBrand = () => {
    if (session.isLoggedIn) {
      setAppView('app')
      setActivePage('Dashboard')
      return
    }
    setAppView('landing')
  }

  const handleBrandKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      navigateFromBrand()
    }
  }

  const brandNavigationProps = {
    role: 'button',
    tabIndex: 0,
    'aria-label': session.isLoggedIn ? 'B-Sure logo, go to Dashboard' : 'B-Sure logo, go to Landing Page',
    onClick: navigateFromBrand,
    onKeyDown: handleBrandKeyDown,
  }

  const renderLanding = () => (
    <div className="landing-shell">
      <header className="landing-header">
        <div className="brand-box landing-brand" {...brandNavigationProps}>
          <BrandMark />
          <div>
            <span className="brand-wordmark">B-Sure</span>
            <small>Medication care</small>
          </div>
        </div>

        <nav className="landing-nav">
          <button type="button" className="secondary-btn" onClick={() => {
            setAuthMode('login')
            setAuthError('')
            setAppView('login')
          }}>Login</button>
          <button type="button" className="primary-btn" onClick={() => {
            setAuthMode('signup')
            setSignupErrors({})
            setAppView('auth')
          }}>Get Started</button>
        </nav>
      </header>

      <main className="landing-main">
        <section className="landing-hero section-reveal">
          <div className="hero-text">
            <p className="eyebrow accent">B-Sure</p>
            <h1>Stay on track with every dose.</h1>
            <p className="hero-subtitle">B-Sure turns your doctor&apos;s prescription into a simple medication routine, helping you remember what to take and when.</p>
            <div className="hero-actions">
              <button type="button" className="secondary-btn" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>How B-Sure Works</button>
            </div>
            <div className="hero-badges">
              <span>Prescription scanning</span>
              <span>Refill alerts</span>
              <span>Caregiver support</span>
            </div>
          </div>

          <div className="hero-visual section-card">
            <div className="mini-box schedule-box">
              <span>Today</span>
              <strong>8:00 AM</strong>
              <p>Paracetamol</p>
            </div>
            <div className="mini-box reminders-box">
              <span>Voice reminder</span>
              <strong>On</strong>
              <p>{session.isLoggedIn
                ? indianLanguages.find((language) => language.value === settings.voiceLanguage)?.label || 'Your chosen language'
                : 'Your chosen language'}</p>
            </div>
            <div className="timeline-stack">
              <div className="stack-item"><span className="dot success"></span>Paracetamol — Taken</div>
              <div className="stack-item"><span className="dot warning"></span>Cetirizine — Upcoming</div>
              <div className="stack-item"><span className="dot muted"></span>Metformin — Tonight</div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="landing-section section-reveal">
          <div className="section-header">
            <p className="eyebrow">How it works</p>
            <h2>Simple steps for a calmer routine.</h2>
          </div>

          <div className="feature-row landing-grid">
            {[{
              step: '1',
              title: 'Scan your prescription',
              text: 'Upload or photograph the prescription and let B-Sure organize your medicines.',
            }, {
              step: '2',
              title: 'Review your medicines',
              text: 'Check each medicine, dosage, and timing before it gets added to your routine.',
            }, {
              step: '3',
              title: 'Get your daily schedule',
              text: 'See morning, afternoon, and night doses clearly in one place.',
            }, {
              step: '4',
              title: 'Never miss an important dose',
              text: 'Receive reminders, progress updates, and caregiver alerts before it is too late.',
            }].map((item) => (
              <article key={item.step} className="info-card reveal-card">
                <span className="step-badge">{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section section-reveal">
          <div className="section-header">
            <p className="eyebrow">Key benefits</p>
            <h2>Made for everyday medicine management.</h2>
          </div>

          <div className="benefits-grid">
            {['Prescription scanning', 'Medication reminders', 'Adherence tracking', 'Caregiver support', 'Refill alerts', 'Voice reminders'].map((benefit) => (
              <div key={benefit} className="benefit-item"><span>✓</span> {benefit}</div>
            ))}
          </div>
        </section>

        <section className="landing-section section-reveal">
          <div className="section-header narrow">
            <p className="eyebrow">Elderly-friendly design</p>
            <h2>Clear, supportive, and easy to use.</h2>
          </div>

          <div className="feature-row info-grid">
            <article className="info-card open-card">
              <h3>Clear information</h3>
              <p>Large readable text and clean labels reduce confusion during daily routines.</p>
            </article>
            <article className="info-card open-card">
              <h3>Simple actions</h3>
              <p>One-tap actions keep status updates fast for patients and family members.</p>
            </article>
            <article className="info-card open-card">
              <h3>Voice reminders</h3>
              <p>Patients can hear a spoken reminder in their selected language before a dose is due.</p>
            </article>
            <article className="info-card open-card">
              <h3>Caregiver support</h3>
              <p>Keep family and caregivers in the loop without adding confusion to the routine.</p>
            </article>
          </div>
        </section>

      </main>
    </div>
  )

  const renderAuth = () => (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="brand-box auth-brand" {...brandNavigationProps}>
          <BrandMark />
          <div>
            <span className="brand-wordmark">B-Sure</span>
            <small>Medication care</small>
          </div>
        </div>

        <div className="auth-toggle">
          <button type="button" className={authMode === 'login' ? 'auth-tab active' : 'auth-tab'} onClick={() => {
            setAuthMode('login')
            setAuthError('')
          }}>Login</button>
          <button type="button" className={authMode === 'signup' ? 'auth-tab active' : 'auth-tab'} onClick={() => {
            setAuthMode('signup')
            setSignupErrors({})
          }}>Sign Up</button>
        </div>

        {authMode === 'login' ? (
          <form className="auth-form" onSubmit={handleLogin}>
            <label>
              Email
              <input type="text" aria-invalid={Boolean(loginErrors.email)} value={loginForm.email} onChange={(event) => {
                setLoginForm((current) => ({ ...current, email: event.target.value }))
                setLoginErrors((current) => ({ ...current, email: '' }))
                setAuthError('')
              }} placeholder="you@example.com" />
              {loginErrors.email && <span className="field-error" role="alert">{loginErrors.email}</span>}
            </label>

            <label>
              Password
              <input type="password" aria-invalid={Boolean(loginErrors.password)} value={loginForm.password} onChange={(event) => {
                setLoginForm((current) => ({ ...current, password: event.target.value }))
                setLoginErrors((current) => ({ ...current, password: '' }))
                setAuthError('')
              }} placeholder="••••••••" />
              {loginErrors.password && <span className="field-error" role="alert">{loginErrors.password}</span>}
            </label>

            {authError && <p className="auth-error" role="alert">{authError}</p>}

            <div className="auth-row">
              <label className="checkbox-row">
                <input type="checkbox" checked={loginForm.rememberMe} onChange={(event) => setLoginForm((current) => ({ ...current, rememberMe: event.target.checked }))} />
                <span>Remember me</span>
              </label>
              <button type="button" className="text-btn" onClick={() => {
                setForgotContact('')
                setForgotError('')
                setForgotSubmitted(false)
                setAppView('forgot')
              }}>Forgot password</button>
            </div>

            <button type="submit" className="primary-btn wide-btn">Login</button>
            <p className="auth-switch">Need an account? <button type="button" className="text-btn inline" onClick={() => setAuthMode('signup')}>Sign Up</button></p>
            <aside className="demo-accounts" aria-label="Demo accounts">
              <strong>Demo accounts</strong>
              <div className="demo-account-row"><span>Patient Demo<br /><small>priya.test@bsure.demo</small></span><button type="button" className="text-btn" onClick={() => {
                setLoginForm((current) => ({ ...current, email: demoPatient.email, password: demoPatient.password }))
                setLoginErrors({})
                setAuthError('')
              }}>Use patient demo</button></div>
              <div className="demo-account-row"><span>Caregiver Demo<br /><small>anita.test@bsure.demo</small></span><button type="button" className="text-btn" onClick={() => {
                setLoginForm((current) => ({ ...current, email: demoCaregiver.email, password: demoCaregiver.password }))
                setLoginErrors({})
                setAuthError('')
              }}>Use caregiver demo</button></div>
            </aside>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleSignUp}>
            <label>
              Full name
              <input type="text" aria-invalid={Boolean(signupErrors.name)} value={authForm.name} onChange={(event) => {
                setAuthForm((current) => ({ ...current, name: event.target.value }))
                setSignupErrors((current) => ({ ...current, name: event.target.value.trim() ? '' : current.name }))
              }} placeholder="Priya Sharma" />
              {signupErrors.name && <span className="field-error" role="alert">{signupErrors.name}</span>}
            </label>

            <label>
              Email / phone
              <input type="text" aria-invalid={Boolean(signupErrors.email)} value={authForm.email} onChange={(event) => {
                setAuthForm((current) => ({ ...current, email: event.target.value }))
                setSignupErrors((current) => ({ ...current, email: event.target.value.trim() ? '' : current.email }))
              }} placeholder="you@example.com" />
              {signupErrors.email && <span className="field-error" role="alert">{signupErrors.email}</span>}
            </label>

            <label>
              Password
              <input type="password" aria-invalid={Boolean(signupErrors.password)} value={authForm.password} onChange={(event) => {
                setAuthForm((current) => ({ ...current, password: event.target.value }))
                setSignupErrors((current) => ({ ...current, password: event.target.value ? '' : current.password }))
              }} placeholder="Create a password" />
              {signupErrors.password && <span className="field-error" role="alert">{signupErrors.password}</span>}
            </label>

            <label>
              Confirm password
              <input type="password" aria-invalid={Boolean(signupErrors.confirmPassword)} value={authForm.confirmPassword} onChange={(event) => {
                setAuthForm((current) => ({ ...current, confirmPassword: event.target.value }))
                setSignupErrors((current) => ({ ...current, confirmPassword: event.target.value === authForm.password ? '' : current.confirmPassword }))
              }} placeholder="Confirm password" />
              {signupErrors.confirmPassword && <span className="field-error" role="alert">{signupErrors.confirmPassword}</span>}
            </label>

            <button type="submit" className="primary-btn wide-btn">Create Account</button>
            <p className="auth-switch">Already have an account? <button type="button" className="text-btn inline" onClick={() => setAuthMode('login')}>Login</button></p>
          </form>
        )}
      </div>
    </div>
  )

  const renderForgotPassword = () => (
    <div className="auth-shell">
      <section className="auth-card forgot-card">
        <div className="brand-box auth-brand" {...brandNavigationProps}>
          <BrandMark />
          <div>
            <span className="brand-wordmark">B-Sure</span>
            <small>Medication care</small>
          </div>
        </div>

        {forgotSubmitted ? (
          <div className="forgot-success" role="status">
            <p className="eyebrow">Account support</p>
            <h1>Check your inbox</h1>
            <p>If an account exists for this contact, reset instructions would be sent here.</p>
            <strong>{forgotContact}</strong>
            <button type="button" className="primary-btn wide-btn" onClick={returnToLogin}>Back to Login</button>
          </div>
        ) : (
          <>
            <div className="forgot-heading">
              <h1>Forgot your password?</h1>
              <p>Don&apos;t worry. Enter the email or phone number associated with your B-Sure account and we&apos;ll help you reset your password.</p>
            </div>
            <form className="auth-form" onSubmit={handleForgotPassword}>
              <label>
                Email / phone
                <input
                  type="text"
                  value={forgotContact}
                  aria-invalid={Boolean(forgotError)}
                  onChange={(event) => {
                    setForgotContact(event.target.value)
                    setForgotError('')
                  }}
                  placeholder="you@example.com or phone number"
                />
                {forgotError && <span className="field-error" role="alert">{forgotError}</span>}
              </label>
              <button type="submit" className="primary-btn wide-btn">Send reset link</button>
              <button type="button" className="text-btn forgot-back" onClick={returnToLogin}>Back to Login</button>
            </form>
          </>
        )}
      </section>
    </div>
  )

  const renderDashboard = () => (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">Today</p>
          <h1>Good morning, {userProfile.name.split(' ')[0] || 'Priya'}</h1>
        </div>

        <div className="topbar-actions">
          <button type="button" className="secondary-btn small-btn" onClick={() => setNotificationsOpen(true)}>
            Notifications <span className="notification-badge">{unreadNotificationCount}</span>
          </button>
          <button type="button" className="ghost-btn" onClick={() => setProfileOpen(true)}>Profile</button>
          <button type="button" className="ghost-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <section className="hero-panel" aria-labelledby="next-medication-heading">
        <div className="hero-copy">
          <p className="eyebrow">Next medication</p>
          <div className="next-medication">
            <div>
              <h2 id="next-medication-heading">{nextMedication?.name || 'No medication scheduled'}</h2>
              <div className="medication-meta">{nextMedication ? `${nextMedication.dosage} · ${nextMedication.timing} · ${nextMedication.foodInstruction}` : 'No active dose today'}</div>
            </div>
            <span className="status-badge success">{!nextMedication ? 'No doses today' : nextMedication.status === 'taken' ? 'Taken' : nextMedication.status === 'missed' ? 'Missed' : nextMedication.status === 'upcoming' ? 'Upcoming' : 'Due now'}</span>
          </div>

          <div className="primary-actions">
            {nextMedication && (
              <>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => updateMedicineStatus(nextMedication.id, 'taken', `${nextMedication.name} marked as taken.`)}
                >
                  Mark as Taken
                </button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => updateMedicineStatus(nextMedication.id, 'skipped', `${nextMedication.name} was skipped.`)}
                >
                  Skip Dose
                </button>
              </>
            )}
          </div>
        </div>

        <div className="hero-metrics">
          <div className="metric-card muted-card">
            <p>Remaining stock</p>
            <strong>{medicines.length ? `${medicines[0].remainingStock} tablets` : 'No stock tracked'}</strong>
            <span>{medicines.length ? 'Approximately 4 days left' : 'Add medicines to track refills'}</span>
          </div>
        </div>
      </section>

      <section className="feature-row dashboard-support">
        <article className="panel voice-panel">
          <div className="panel-header">
            <h3>Voice reminders</h3>
          </div>
          <p>Receive spoken medication reminders.</p>
          <div className="voice-controls">
            <label className="switch-row">
              <input type="checkbox" checked={settings.voiceEnabled} onChange={(event) => setSettings((current) => ({ ...current, voiceEnabled: event.target.checked }))} />
              <span>Enable Voice Reminders</span>
            </label>

            <label>
              Language
              <select value={settings.voiceLanguage} onChange={(event) => setSettings((current) => ({ ...current, voiceLanguage: event.target.value }))}>
                {indianLanguages.map((language) => (
                  <option key={language.value} value={language.value}>{language.label}</option>
                ))}
              </select>
            </label>

            <div className="voice-meta">
              <span>{findVoice(availableVoices, settings.voiceLanguage)
                ? `Available voice: ${selectedVoiceName}`
                : `Voice playback for ${indianLanguages.find((language) => language.value === settings.voiceLanguage)?.label} isn't available on your device.`}</span>
              <span>{voiceStatus}</span>
              {voiceError && <strong className="voice-error">{voiceError}</strong>}
            </div>

            <div className="voice-actions">
              <button type="button" className="primary-btn" onClick={testVoice}>Test Voice</button>
              <button type="button" className="secondary-btn" onClick={() => setSettings((current) => ({ ...current, reminderMinutes: 15 }))}>15 min</button>
              <button type="button" className="secondary-btn" onClick={() => setSettings((current) => ({ ...current, reminderMinutes: 30 }))}>30 min</button>
              <button type="button" className="secondary-btn" onClick={() => setSettings((current) => ({ ...current, reminderMinutes: 45 }))}>45 min</button>
              <button type="button" className="secondary-btn" onClick={() => setSettings((current) => ({ ...current, reminderMinutes: 60 }))}>60 min</button>
            </div>

            <div className="timing-box">
              Reminder: {settings.reminderMinutes} minutes before medication
            </div>
          </div>
        </article>

        <article className="panel notifications-panel" aria-labelledby="notifications-heading">
          <div className="panel-header">
            <h3 id="notifications-heading">Notifications</h3>
            <div className="button-row">
              <button type="button" className="panel-link" onClick={handleMarkAllNotificationsRead} disabled={unreadNotificationCount === 0}>Mark all read</button>
              <button type="button" className="panel-link" onClick={() => setNotificationsOpen(true)}>View all</button>
            </div>
          </div>
          {notifications.length ? (
            <ul className="notification-list">
              {notifications.slice(0, 3).map((notification) => (
                <li key={notification.id} className={notification.read ? 'read' : ''}>
                  <div className="dot-separator" aria-hidden="true"></div>
                  <div>
                    <strong>{notification.type}</strong>
                    <span>{notification.message}</span>
                  </div>
                  <span className="tag-pill">{notification.tag}</span>
                </li>
              ))}
            </ul>
          ) : <p className="panel-copy">You&apos;re all caught up.</p>}
        </article>
      </section>
    </>
  )

  const renderMedicines = () => (
    <section className="page-section">
      <div className="page-header-row">
        <div>
          <p className="eyebrow">Medicines</p>
          <h2>Medication routine</h2>
        </div>
        <div className="button-row">
          <button type="button" className="secondary-btn" onClick={() => {
            setMedicines([])
            showToast('Medicines cleared')
          }} disabled={medicines.length === 0}>Clear</button>
          <button type="button" className="primary-btn" onClick={() => setActivePage('Scan Prescription')}>Add prescription</button>
        </div>
      </div>

      <div className="medicine-grid">
        {deduplicateMedicines(medicines).map((medicine) => (
          <article key={medicine.id} className="medicine-card">
            <div className="medicine-topline">
              <div>
                <h3>{medicine.name}</h3>
                <p>{medicine.dosage}</p>
              </div>
              <span className={`small-tag ${medicine.status}`}>
                {medicine.status === 'taken' ? 'Taken' : medicine.status === 'skipped' ? 'Skipped' : medicine.status === 'missed' ? 'Missed' : 'Due'}
              </span>
            </div>

            <dl className="medicine-meta">
              <div><dt>Time</dt><dd>{medicine.timing}</dd></div>
              <div><dt>Food</dt><dd>{medicine.foodInstruction}</dd></div>
              <div><dt>Stock</dt><dd>{medicine.remainingStock} tablets</dd></div>
            </dl>

            <div className="medicine-actions">
              <button type="button" className="secondary-btn" onClick={() => setSelectedMedicine(medicine)}>View details</button>
              <button type="button" className="primary-btn" onClick={() => updateMedicineStatus(medicine.id, 'taken', `${medicine.name} marked as taken.`)}>Mark as Taken</button>
              <button type="button" className="ghost-btn" onClick={() => updateMedicineStatus(medicine.id, 'skipped', `${medicine.name} was skipped.`)}>Skip dose</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )

  const renderScanPrescription = () => (
    <section className="page-section">
      <div className="page-header-row">
        <div>
          <p className="eyebrow">Scan Prescription</p>
          <h2>Upload or photograph a prescription</h2>
        </div>
      </div>

      <div className="scan-page-shell">
        <div className="scan-upload-card">
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,application/pdf" hidden onChange={handleFileSelect} />

          {cameraState.cameraOpen ? (
            <div className="camera-box">
              <video ref={cameraVideoRef} autoPlay playsInline muted />
              <div className="camera-actions">
                <button type="button" className="primary-btn" onClick={capturePhoto}>Capture Photo</button>
                <button type="button" className="secondary-btn" onClick={closeCamera}>Cancel</button>
              </div>
            </div>
          ) : previewUrl ? (
            <div className="preview-box">
              {selectedFile?.type === 'application/pdf' ? (
                <div className="pdf-preview"><strong>PDF selected</strong><span>{selectedFile.name}</span></div>
              ) : <img src={previewUrl} alt="Prescription preview" />}
              <div className="preview-actions">
                {cameraState.photo && <button type="button" className="secondary-btn" onClick={openCamera}>Retake</button>}
                <button type="button" className="secondary-btn" onClick={openScanFilePicker}>Replace image</button>
                <button type="button" className="primary-btn" onClick={handleContinueScan} disabled={isSubmittingPrescription || scanState === 'processing'}>{isSubmittingPrescription ? 'Analyzing Prescription...' : cameraState.photo ? 'Use Photo' : 'Continue'}</button>
              </div>
            </div>
          ) : (
            <div className="upload-zone" onClick={openScanFilePicker} role="button" tabIndex="0" onKeyDown={(event) => event.key === 'Enter' && openScanFilePicker()}>
              <div className="upload-icon large" aria-hidden="true">▣</div>
              <p>Upload a prescription</p>
              <span>Upload a clear photo of your doctor&apos;s prescription.</span>
            </div>
          )}

          {cameraState.permissionError && <div className="camera-error">{cameraState.permissionError}</div>}

          <div className="button-row camera-row">
            <button type="button" className="primary-btn" onClick={openScanFilePicker}>Upload Prescription</button>
            <button type="button" className="secondary-btn" onClick={openCamera}>Take Photo</button>
          </div>
        </div>

        {scanState === 'processing' && (
          <div className="scan-processing">
            <div className="processing-lines">
              <span className="done">✓ Prescription uploaded</span>
              <span className="active">● Reading prescription...</span>
              <span>○ Medicines identified</span>
            </div>
          </div>
        )}

        {scanState === 'results' && (
          <div className="ocr-card">
            <div className="ocr-header">
              <h3>Review extracted medicines</h3>
              <p>Please review your medicines before continuing.</p>
            </div>

            <div className="ocr-list">
              {ocrResults.map((medicine) => (
                <div key={medicine.id} className="ocr-row">
                  <label>
                    Medicine name
                    <input value={medicine.name} onChange={(event) => updateOcrField(medicine.id, 'name', event.target.value)} />
                  </label>
                  <label>
                    Dosage
                    <input value={medicine.dosage} onChange={(event) => updateOcrField(medicine.id, 'dosage', event.target.value)} />
                  </label>
                  <label>
                    Frequency
                    <input value={medicine.frequency} onChange={(event) => updateOcrField(medicine.id, 'frequency', event.target.value)} />
                  </label>
                  <label>
                    Duration
                    <input value={medicine.duration} onChange={(event) => updateOcrField(medicine.id, 'duration', event.target.value)} />
                  </label>
                  <label>
                    Timing
                    <input value={medicine.timing} onChange={(event) => updateOcrField(medicine.id, 'timing', event.target.value)} />
                  </label>
                  <label>
                    Food instruction
                    <input value={medicine.foodInstruction} onChange={(event) => updateOcrField(medicine.id, 'foodInstruction', event.target.value)} />
                  </label>
                </div>
              ))}
            </div>

            <div className="ocr-actions">
              <button type="button" className="primary-btn" onClick={handleAddMedicines} disabled={isSubmittingMedicines}>{isSubmittingMedicines ? 'Adding Medicines...' : 'Add to My Medicines'}</button>
              <button type="button" className="secondary-btn" onClick={() => setScanState('uploaded')}>Edit Details</button>
            </div>
          </div>
        )}
      </div>
    </section>
  )

  const renderAdherence = () => (
    <section className="page-section">
      <div className="page-header-row">
        <div>
          <p className="eyebrow">Adherence</p>
          <h2>Medication consistency</h2>
        </div>
      </div>

      <div className="adherence-page-grid">
        <article className="panel adherence-panel large">
          <div className="adherence-figure">{adherenceData.percentage}%</div>
          <div className="adherence-stats">
            <div><strong>{adherenceData.taken}</strong><span>taken</span></div>
            <div><strong>{adherenceData.skipped}</strong><span>skipped</span></div>
            <div><strong>{adherenceData.missed}</strong><span>missed</span></div>
            <div><strong>{adherenceData.pending}</strong><span>pending</span></div>
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h3>Weekly medication history</h3>
          </div>
          <div className="week-grid" aria-label="Weekly adherence history">
            {weeklyHistory.map((day) => (
              <div key={day.day} className="week-day">
                <span>{day.day}</span>
                <strong>{day.value}</strong>
              </div>
            ))}
          </div>
        </article>
      </div>
      <article className="panel dose-history-panel">
        <div className="panel-header"><h3>Recent dose history</h3></div>
        {doseHistory.length ? (
          <ul className="dose-history-list">
            {doseHistory.slice(0, 6).map((dose) => (
              <li key={dose.id}>
                <strong>{dose.medicineName}</strong>
                <span>Marked {dose.status} · {new Date(dose.occurredAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        ) : <p className="panel-copy">Dose actions will appear here as you update your routine.</p>}
      </article>
    </section>
  )

  const renderCaregiver = () => {
    const caregiverForm = caregiver || { name: '', relationship: '', contact: '', alertWindow: '30 minutes' }

    return (
      <section className="page-section">
      <div className="page-header-row">
        <div>
          <p className="eyebrow">Caregiver</p>
          <h2>Your care support</h2>
        </div>
      </div>

      <div className="caregiver-form-card">
        {caregiver && <div className="person-row">
          <div className="avatar">{caregiver.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div>
          <div>
            <strong>{caregiver.name}</strong>
            <span>{caregiver.relationship}</span>
          </div>
        </div>}

        <div className="caregiver-grid">
          <label>
            Name
            <input value={caregiverForm.name} onChange={(event) => setCaregiver((previous) => ({ ...caregiverForm, ...previous, name: event.target.value }))} />
          </label>
          <label>
            Relationship
            <input value={caregiverForm.relationship} onChange={(event) => setCaregiver((previous) => ({ ...caregiverForm, ...previous, relationship: event.target.value }))} />
          </label>
          <label className="full-width">
            Contact information
            <input value={caregiverForm.contact} onChange={(event) => setCaregiver((previous) => ({ ...caregiverForm, ...previous, contact: event.target.value }))} />
          </label>
        </div>

        <div className="alert-window">
          <h3>Missed dose alert window</h3>
          <div className="alert-options">
            {['15 minutes', '30 minutes', '1 hour', '2 hours'].map((option) => (
              <button
                key={option}
                type="button"
                className={caregiverForm.alertWindow === option ? 'option-btn active' : 'option-btn'}
                onClick={() => {
                  setCaregiver((previous) => ({ ...caregiverForm, ...previous, alertWindow: option }))
                  showToast(`Alert window updated to ${option}.`)
                }}
              >
                {option}
              </button>
            ))}
          </div>
          <p>Your caregiver can be notified if a scheduled dose remains missed beyond this time.</p>
        </div>

        <div className="caregiver-actions">
          <button type="button" className="primary-btn" onClick={() => showToast('Caregiver details updated.')}>Save caregiver</button>
          {caregiver && <button type="button" className="secondary-btn" onClick={() => {
            setCaregiver(null)
            showToast('Caregiver removed.')
          }}>Remove caregiver</button>}
        </div>
      </div>
    </section>
    )
  }

  const renderCaregiverDashboard = () => (
    <div className="caregiver-demo-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Care recipient</p>
          <h1>{session.user.connectedPatientName || demoPatient.name}</h1>
        </div>
        <button type="button" className="secondary-btn" onClick={handleLogout}>Logout</button>
      </header>

      <section className="caregiver-demo-grid">
        <article className="panel caregiver-recipient-card">
          <div className="panel-header"><h3>Medication adherence</h3></div>
          <div className="adherence-figure">{adherenceData.percentage}%</div>
          <div className="adherence-stats">
            <div><strong>{adherenceData.taken}</strong><span>taken</span></div>
            <div><strong>{adherenceData.skipped}</strong><span>skipped</span></div>
            <div><strong>{adherenceData.missed}</strong><span>missed</span></div>
            <div><strong>{adherenceData.pending}</strong><span>pending</span></div>
          </div>
        </article>
        <article className="panel caregiver-recipient-card">
          <div className="panel-header"><h3>Today's medication status</h3></div>
          <ul className="caregiver-dose-list">
            {medicines.map((medicine) => (
              <li key={medicine.id} className={`state-${medicine.status}`}>
                <span>{medicine.status === 'taken' ? '✓' : medicine.status === 'missed' ? '⚠' : '○'}</span>
                <div><strong>{medicine.name}</strong><small>{medicine.timing} · {medicine.status}</small></div>
              </li>
            ))}
          </ul>
        </article>
      </section>
      <article className="caregiver-alert-banner">
        <strong>Caregiver alert</strong>
        <span>{medicines.find((medicine) => medicine.status === 'missed')
          ? `${userProfile.name} missed her ${medicines.find((medicine) => medicine.status === 'missed').timing} medication.`
          : 'No missed-dose alerts right now.'}</span>
        <small>Alert window: {caregiver?.alertWindow || demoCaregiver.alertWindow}</small>
      </article>
    </div>
  )

  const renderPage = () => {
    switch (activePage) {
      case 'Dashboard':
        return renderDashboard()
      case 'Medicines':
        return renderMedicines()
      case 'Scan Prescription':
        return renderScanPrescription()
      case 'Adherence':
        return renderAdherence()
      case 'Caregiver':
        return renderCaregiver()
      default:
        return renderDashboard()
    }
  }

  return appView === 'landing' ? renderLanding() : appView === 'auth' ? renderAuth() : appView === 'login' ? renderAuth() : appView === 'forgot' ? renderForgotPassword() : session.user?.role === 'caregiver' ? renderCaregiverDashboard() : (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Sidebar navigation">
        <div className="brand-box" {...brandNavigationProps}>
          <BrandMark />
          <div>
            <span className="brand-wordmark">B-Sure</span>
            <small>Medication care</small>
          </div>
        </div>

        <nav className="nav-menu" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              key={item}
              type="button"
              className={item === activePage ? 'nav-item active' : 'nav-item'}
              onClick={() => setActivePage(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="sidebar-panel">
          <p>Caregiver alert</p>
          <strong>{caregiver?.alertWindow || '30 minutes'}</strong>
          <span>Your caregiver can be notified if a dose remains missed beyond this time.</span>
        </div>
      </aside>

      <main className="main-panel">{renderPage()}</main>

      <nav className="mobile-nav" aria-label="Quick navigation">
        {navItems.map((item) => (
          <button
            key={item}
            type="button"
            className={item === activePage ? 'mobile-item active' : 'mobile-item'}
            onClick={() => setActivePage(item)}
          >
            {item === 'Dashboard' ? 'Dashboard' : item === 'Scan Prescription' ? 'Scan' : item}
          </button>
        ))}
      </nav>

      {notificationsOpen && (
        <div className="modal-backdrop" onClick={() => setNotificationsOpen(false)}>
          <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Notifications</h3>
              <button type="button" className="ghost-btn" onClick={() => setNotificationsOpen(false)}>Close</button>
            </div>
            <ul className="notification-list modal-list">
              {notifications.map((notification) => (
                <li key={notification.id} className={notification.read ? 'read' : ''}>
                  <div className="dot-separator" aria-hidden="true"></div>
                  <div>
                    <strong>{notification.type}</strong>
                    <span>{notification.message}</span>
                  </div>
                  <div className="modal-actions">
                    <span className="tag-pill">{notification.tag}</span>
                    {!notification.read && (
                      <button type="button" className="ghost-btn" onClick={() => handleNotificationRead(notification.id)}>Mark read</button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {profileOpen && (
        <div className="modal-backdrop" onClick={closeProfile}>
          <div className="modal-panel profile-panel" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Profile</h3>
              <button type="button" className="ghost-btn" onClick={closeProfile}>Close</button>
            </div>
            <div className="profile-info">
              <div className="avatar large profile-avatar" role="img" aria-label={`${userProfile.name || 'Patient'} profile photo`}>
                {profilePhotoDraft || userProfile.avatarUrl
                  ? <img src={profilePhotoDraft || userProfile.avatarUrl} alt="Profile" />
                  : userProfile.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}
              </div>
              <div>
                <strong>{userProfile.name}</strong>
                <span>{userProfile.age}</span>
              </div>
            </div>
            <input
              ref={profilePhotoInputRef}
              className="visually-hidden"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label="Upload profile photo"
              onChange={handleProfilePhotoUpload}
            />
            <div className="profile-photo-actions">
              <button type="button" className="secondary-btn" onClick={() => profilePhotoInputRef.current?.click()}>Upload photo</button>
              <button type="button" className="secondary-btn" onClick={openProfileCamera}>Take photo</button>
            </div>
            {profileCamera.error && (
              <div className="profile-camera-error" role="alert">
                <span>{profileCamera.error}</span>
                <button type="button" className="text-btn" onClick={() => profilePhotoInputRef.current?.click()}>Upload photo</button>
              </div>
            )}
            {profileCamera.open && (
              <div className="profile-camera">
                <video ref={profileCameraVideoRef} autoPlay playsInline muted aria-label="Live profile camera preview" />
                <div className="profile-camera-actions">
                  <button type="button" className="primary-btn" onClick={captureProfilePhoto}>Capture</button>
                  <button type="button" className="secondary-btn" onClick={cancelProfileCamera}>Cancel</button>
                </div>
              </div>
            )}
            {profilePhotoDraft && (
              <div className="profile-camera-actions profile-photo-confirm">
                <button type="button" className="secondary-btn" onClick={openProfileCamera}>Retake</button>
                <button type="button" className="primary-btn" onClick={useProfilePhotoDraft}>Use Photo</button>
              </div>
            )}
            <div className="profile-form">
              <label>
                Name
                <input value={userProfile.name} onChange={(event) => setUserProfile((current) => ({ ...current, name: event.target.value }))} />
              </label>
              <label>
                Email / phone
                <input value={userProfile.email} onChange={(event) => setUserProfile((current) => ({ ...current, email: event.target.value }))} />
              </label>
              <label>
                Preferred language
                <select value={userProfile.preferredLanguage} onChange={(event) => setUserProfile((current) => ({ ...current, preferredLanguage: event.target.value }))}>
                  {indianLanguages.map((language) => (
                    <option key={language.value} value={language.label}>{language.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <button type="button" className="primary-btn" onClick={() => {
              closeProfile()
              showToast('Profile saved')
            }}>Save</button>
          </div>
        </div>
      )}

      {selectedMedicine && (
        <div className="modal-backdrop" onClick={() => setSelectedMedicine(null)}>
          <div className="modal-panel medicine-panel" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedMedicine.name}</h3>
              <button type="button" className="ghost-btn" onClick={() => setSelectedMedicine(null)}>Close</button>
            </div>

            <dl className="medicine-detail-list">
              <div><dt>Dosage</dt><dd>{selectedMedicine.dosage}</dd></div>
              <div><dt>Frequency</dt><dd>{selectedMedicine.frequency}</dd></div>
              <div><dt>Timing</dt><dd>{selectedMedicine.timing}</dd></div>
              <div><dt>Food</dt><dd>{selectedMedicine.foodInstruction}</dd></div>
              <div><dt>Duration</dt><dd>{selectedMedicine.duration}</dd></div>
              <div><dt>Stock</dt><dd>{selectedMedicine.remainingStock} tablets</dd></div>
            </dl>

            <div className="modal-actions vertical">
              <button type="button" className="primary-btn" onClick={() => {
                updateMedicineStatus(selectedMedicine.id, 'taken', `${selectedMedicine.name} marked as taken.`)
                setSelectedMedicine(null)
              }}>Mark as Taken</button>
              <button type="button" className="secondary-btn" onClick={() => {
                updateMedicineStatus(selectedMedicine.id, 'skipped', `${selectedMedicine.name} was skipped.`)
                setSelectedMedicine(null)
              }}>Skip dose</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

export default App
