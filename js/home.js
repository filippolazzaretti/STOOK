import { STORAGE_KEYS, getUniversityById } from './university-data.js';

const personalizedSection = document.getElementById('personalized-campus');
const campusName = document.getElementById('campus-name');
const campusDescription = document.getElementById('campus-description');
const campusList = document.getElementById('campus-list');

initializeHomePersonalization();

function initializeHomePersonalization() {
  const storedUniversityId = window.localStorage.getItem(STORAGE_KEYS.preferredUniversity);
  const selectedUniversity = getUniversityById(storedUniversityId);

  if (!selectedUniversity || !personalizedSection) {
    return;
  }

  personalizedSection.hidden = false;
  campusName.textContent = selectedUniversity.label;
  campusDescription.textContent = selectedUniversity.description;
  campusList.innerHTML = selectedUniversity.listings.map(function (listing) {
    return '<li><strong>' + escapeHtml(listing.title) + '</strong><span>' + escapeHtml(listing.detail) + '</span></li>';
  }).join('');
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

