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

const fieldConfig = {
  firstName: {
    input: firstNameInput,
    label: 'nome',
    errorNode: document.querySelector('[data-field-error="firstName"]')
  },
  lastName: {
    input: lastNameInput,
    label: 'cognome',
    errorNode: document.querySelector('[data-field-error="lastName"]')
  },
  phone: {
    input: phoneInput,
    label: 'numero di telefono',
    errorNode: document.querySelector('[data-field-error="phone"]')
  },
  university: {
    input: universityInput,
    label: 'ateneo',
    errorNode: document.querySelector('[data-field-error="university"]')
  },
  email: {
    input: registerEmailInput,
    label: 'email',
    errorNode: document.querySelector('[data-field-error="email"]')
  },
  password: {
    input: registerPasswordInput,
    label: 'password',
    errorNode: document.querySelector('[data-field-error="password"]')
  }
};

initializeRegistrationPage();

function initializeRegistrationPage() {
  restorePreferredUniversity();
  renderUniversityPreview(universityInput.value);

  universityInput.addEventListener('change', function () {
    clearFieldError('university');
    renderUniversityPreview(universityInput.value);
  });

  Object.keys(fieldConfig).forEach(function (fieldKey) {
    const field = fieldConfig[fieldKey];
    field.input.addEventListener('input', function () {
      clearFieldError(fieldKey);
    });
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
  clearAllFieldErrors();

  const formData = getFormData();
  const validationIssue = validateFormData(formData);

  if (validationIssue) {
    showFieldError(validationIssue.field, validationIssue.message);
    fieldConfig[validationIssue.field].input.focus();
    return;
  }

  setSubmitting(true);

  try {
    const duplicateCheck = await checkDuplicates(formData);

    if (duplicateCheck.hasDuplicate) {
      const duplicateField = duplicateCheck.duplicate_field === 'full_name' ? 'firstName' : duplicateCheck.duplicate_field;
      showFieldError(duplicateField, duplicateCheck.message);
      fieldConfig[duplicateField].input.focus();
      return;
    }

    const signUpResult = await registerUser(formData);

    if (signUpResult.error) {
      handleAuthError(signUpResult.error);
      return;
    }

    persistUserPreferences(formData.university);
    registerSuccess.textContent = "Account creato. Controlla la tua email per confermare la registrazione prima di accedere. Da ora in poi vedrai contenuti orientati per il tuo ateneo.";
    registerSuccess.style.display = 'block';
    registerForm.reset();
    restorePreferredUniversity();
    renderUniversityPreview(window.localStorage.getItem(STORAGE_KEYS.preferredUniversity));
  } catch (error) {
    registerError.textContent = error.message || 'Registrazione non completata. Riprova tra qualche istante.';
    registerError.style.display = 'block';
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

function validateFormData(formData) {
  const requiredFieldKeys = ['firstName', 'lastName', 'email', 'phone', 'university'];
  const missingFieldKey = requiredFieldKeys.find(function (fieldKey) {
    return !formData[fieldKey];
  });

  if (missingFieldKey) {
    return {
      field: missingFieldKey,
      message: 'Compila il campo obbligatorio: ' + fieldConfig[missingFieldKey].label + '.'
    };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(formData.email)) {
    return {
      field: 'email',
      message: "Inserisci un'email valida."
    };
  }

  const phonePattern = /^[+\d\s().-]{7,20}$/;
  if (!phonePattern.test(formData.phone)) {
    return {
      field: 'phone',
      message: 'Inserisci un numero di telefono valido.'
    };
  }

  if (formData.password.length < 8) {
    return {
      field: 'password',
      message: 'La password deve contenere almeno 8 caratteri.'
    };
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
      throw new Error('Configurazione backend incompleta: aggiorna ed esegui di nuovo lo script SQL di registrazione su Supabase.');
    }

    throw new Error('Impossibile verificare i duplicati in questo momento. Riprova tra poco.');
  }

  if (!data || !Array.isArray(data) || !data[0]) {
    return {
      hasDuplicate: false,
      duplicate_field: null,
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

function handleAuthError(error) {
  const message = (error && error.message ? error.message : '').toLowerCase();

  if (message.includes('already registered') || message.includes('already been registered')) {
    showFieldError('email', "Questa email e' gia registrata. Accedi oppure reimposta la password.");
    registerEmailInput.focus();
    return;
  }

  registerError.textContent = error.message || 'Registrazione non completata. Riprova tra poco.';
  registerError.style.display = 'block';
}

function persistUserPreferences(universityId) {
  window.localStorage.setItem(STORAGE_KEYS.preferredUniversity, universityId);
}

function clearMessages() {
  registerSuccess.style.display = 'none';
  registerError.style.display = 'none';
  registerSuccess.textContent = '';
  registerError.textContent = '';
}

function showFieldError(fieldKey, message) {
  const field = fieldConfig[fieldKey];

  if (!field) {
    registerError.textContent = message;
    registerError.style.display = 'block';
    return;
  }

  field.errorNode.textContent = message;
}

function clearFieldError(fieldKey) {
  const field = fieldConfig[fieldKey];

  if (field) {
    field.errorNode.textContent = '';
  }
}

function clearAllFieldErrors() {
  Object.keys(fieldConfig).forEach(function (fieldKey) {
    clearFieldError(fieldKey);
  });
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
