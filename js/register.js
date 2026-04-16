import { STORAGE_KEYS, getUniversityById } from './university-data.js';

const SUPABASE_URL = 'https://uaelkranbqialxjpoqkk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWxrcmFuYnFpYWx4anBvcWtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzExMDcsImV4cCI6MjA5MTc0NzEwN30.3RAuhcrAlemr9EpwQsdJRj6xzeS2CH0OxRvQrHVFdns';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const registerForm = document.getElementById('register-form');
const firstNameInput = document.getElementById('first-name');
const lastNameInput = document.getElementById('last-name');
const phoneInput = document.getElementById('phone');
const universityInput = document.getElementById('university');
const registerEmailInput = document.getElementById('register-email');
const registerPasswordInput = document.getElementById('register-password');
const registerSuccess = document.getElementById('register-success');
const registerError = document.getElementById('register-error');
const submitButton = registerForm.querySelector('button[type="submit"]');
const previewSection = document.getElementById('university-preview');
const previewTitle = document.getElementById('preview-title');
const previewText = document.getElementById('preview-text');
const previewAudience = document.getElementById('preview-audience');
const previewList = document.getElementById('preview-list');

const requiredFields = [
  { key: 'firstName', input: firstNameInput, label: 'nome' },
  { key: 'lastName', input: lastNameInput, label: 'cognome' },
  { key: 'email', input: registerEmailInput, label: 'email' },
  { key: 'phone', input: phoneInput, label: 'numero di telefono' },
  { key: 'university', input: universityInput, label: 'ateneo' }
];

initializeRegistrationPage();

function initializeRegistrationPage() {
  restorePreferredUniversity();
  renderUniversityPreview(universityInput.value);

  universityInput.addEventListener('change', function () {
    renderUniversityPreview(universityInput.value);
  });

  registerForm.addEventListener('submit', handleRegisterSubmit);
}

function restorePreferredUniversity() {
  const storedUniversityId = window.localStorage.getItem(STORAGE_KEYS.preferredUniversity);

  if (storedUniversityId && getUniversityById(storedUniversityId)) {
    universityInput.value = storedUniversityId;
  }
}

function renderUniversityPreview(universityId) {
  const selectedUniversity = getUniversityById(universityId);

  if (!selectedUniversity) {
    previewSection.hidden = true;
    previewTitle.textContent = '';
    previewText.textContent = '';
    previewAudience.textContent = '';
    previewList.innerHTML = '';
    return;
  }

  previewSection.hidden = false;
  previewTitle.textContent = selectedUniversity.headline;
  previewText.textContent = selectedUniversity.description;
  previewAudience.textContent = selectedUniversity.audience;
  previewList.innerHTML = selectedUniversity.listings.map(function (listing) {
    return '<li><strong>' + escapeHtml(listing.title) + '</strong><span>' + escapeHtml(listing.detail) + '</span></li>';
  }).join('');
}

async function handleRegisterSubmit(event) {
  event.preventDefault();
  clearMessages();

  const formData = getFormData();
  const validationError = validateRequiredFields(formData) || validateFieldFormats(formData);

  if (validationError) {
    showError(validationError);
    focusInputForError(validationError);
    return;
  }

  setSubmitting(true);

  try {
    const duplicateCheck = await checkDuplicates(formData);

    if (duplicateCheck.hasDuplicate) {
      showError(duplicateCheck.message);
      focusDuplicateField(duplicateCheck.duplicateField);
      return;
    }

    const signUpResult = await registerUser(formData);

    if (signUpResult.error) {
      showError(mapAuthError(signUpResult.error));
      return;
    }

    persistUserPreferences(formData.university);
    registerSuccess.textContent = "Account creato. Controlla la tua email per confermare la registrazione prima di accedere. Da ora in poi vedrai contenuti orientati per il tuo ateneo.";
    registerSuccess.style.display = 'block';
    registerForm.reset();
    restorePreferredUniversity();
    renderUniversityPreview(window.localStorage.getItem(STORAGE_KEYS.preferredUniversity));
  } catch (error) {
    showError(error.message || 'Registrazione non completata. Riprova tra qualche istante.');
  } finally {
    setSubmitting(false);
  }
}

function getFormData() {
  return {
    firstName: firstNameInput.value.trim(),
    lastName: lastNameInput.value.trim(),
    email: registerEmailInput.value.trim().toLowerCase(),
    phone: phoneInput.value.trim(),
    university: universityInput.value,
    password: registerPasswordInput.value
  };
}

function validateRequiredFields(formData) {
  const missingField = requiredFields.find(function (field) {
    return !formData[field.key];
  });

  if (!missingField) {
    return null;
  }

  return 'Compila il campo obbligatorio: ' + missingField.label + '.';
}

function validateFieldFormats(formData) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^[+\d\s().-]{7,20}$/;

  if (!emailPattern.test(formData.email)) {
    return "Inserisci un'email valida.";
  }

  if (!phonePattern.test(formData.phone)) {
    return 'Inserisci un numero di telefono valido.';
  }

  if (formData.password.length < 8) {
    return 'La password deve contenere almeno 8 caratteri.';
  }

  return null;
}

async function checkDuplicates(formData) {
  const { data, error } = await supabaseClient.rpc('check_registration_duplicates', {
    candidate_email: formData.email,
    candidate_first_name: formData.firstName,
    candidate_last_name: formData.lastName
  });

  if (error) {
    if (error.message && error.message.includes('check_registration_duplicates')) {
      throw new Error('Configurazione backend incompleta: applica lo script SQL di registrazione su Supabase prima di usare i controlli duplicati.');
    }

    throw new Error('Impossibile verificare i duplicati in questo momento. Riprova tra poco.');
  }

  if (!data || !Array.isArray(data) || !data[0]) {
    return {
      hasDuplicate: false,
      duplicateField: null,
      message: ''
    };
  }

  return data[0];
}

async function registerUser(formData) {
  const emailRedirectTo = window.location.origin + '/accedi.html';

  return supabaseClient.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      emailRedirectTo: emailRedirectTo,
      data: {
        first_name: formData.firstName,
        last_name: formData.lastName,
        full_name: formData.firstName + ' ' + formData.lastName,
        phone: formData.phone,
        university_id: formData.university,
        university_label: getUniversityById(formData.university)?.label || ''
      }
    }
  });
}

function persistUserPreferences(universityId) {
  window.localStorage.setItem(STORAGE_KEYS.preferredUniversity, universityId);
}

function mapAuthError(error) {
  const message = (error && error.message ? error.message : '').toLowerCase();

  if (message.includes('already registered') || message.includes('already been registered')) {
    return "Questa email e' gia registrata. Accedi oppure reimposta la password.";
  }

  return error.message || 'Registrazione non completata. Riprova tra poco.';
}

function focusInputForError(message) {
  const matchingField = requiredFields.find(function (field) {
    return message.toLowerCase().includes(field.label);
  });

  if (matchingField) {
    matchingField.input.focus();
  }
}

function focusDuplicateField(duplicateField) {
  if (duplicateField === 'email') {
    registerEmailInput.focus();
    return;
  }

  if (duplicateField === 'full_name') {
    firstNameInput.focus();
  }
}

function clearMessages() {
  registerSuccess.style.display = 'none';
  registerError.style.display = 'none';
  registerSuccess.textContent = '';
  registerError.textContent = '';
}

function showError(message) {
  registerError.textContent = message;
  registerError.style.display = 'block';
}

function setSubmitting(isSubmitting) {
  submitButton.disabled = isSubmitting;
  submitButton.textContent = isSubmitting ? 'Creazione account...' : 'Crea account';
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}


