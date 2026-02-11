// State
let currentQuestion = 0;
const totalQuestions = 5;
let answers = {};
let totalPoints = 0;
let livePoints = 0;
let currentTier = 100;

// Package definitions
const packages = {
    'tv-internet': {
        100: {
            name: 'Altibox Medium',
            speed: '100 Mbps',
            features: [
                'TV-pakke med 60 valgfrie poeng',
                'Inkluderer TV-boks med opptak og start forfra',
                'Tilgang til Altibox-appen på alle skjermer',
                'Symmetrisk fiberhastighet 100/100 Mbps',
                'Stabil drift for surfing og streaming'
            ]
        },
        500: {
            name: 'Altibox Standard',
            speed: '500 Mbps',
            features: [
                'Inkluderer Netflix-abonnement (Basic)',
                'TV-pakke med 60 valgfrie poeng',
                'Rikelig med kapasitet for en hel familie',
                'Lynrask fiberhastighet 500/500 Mbps',
                'Perfekt for 4K streaming og hjemmekontor'
            ]
        },
        1000: {
            name: 'Altibox Extra',
            speed: '1000 Mbps',
            features: [
                'Inkluderer Netflix-abonnement (Standard)',
                'TV-pakke med 110 valgfrie poeng',
                'Markedets råeste fiberhastighet 1000/1000 Mbps',
                'Ubegrenset kapasitet uansett antall brukere',
                'Alltid maksimal ytelse og stabilitet'
            ]
        }
    },
    'internet-only': {
        100: {
            name: 'Fiber 100',
            speed: '100 Mbps',
            features: [
                'Rimelig og stabilt fiberbredbånd',
                'Symmetrisk hastighet 100/100 Mbps',
                'Perfekt for 1-2 personer og vanlig bruk',
                'Garantert hastighet rett inn i veggen',
                'Ingen datakvoter eller begrensninger'
            ]
        },
        500: {
            name: 'Fiber 500',
            speed: '500 Mbps',
            features: [
                'Lynraskt internett for hele familien',
                'Symmetrisk hastighet 500/500 Mbps',
                'Takler mange samtidige brukere uten hakking',
                'Ideelt for gaming og tung fildeling',
                'Mulighet for å inkludere Netflix'
            ]
        },
        1000: {
            name: 'Fiber 1000',
            speed: '1000 Mbps',
            features: [
                'Uovertruffen hastighet 1000/1000 Mbps',
                'Inkluderer Netflix-abonnement',
                'Eliminerer all venting ved nedlasting',
                'Maksimal stabilitet for krevende bruk',
                'Fremtidssikret for alle dine enheter'
            ]
        }
    }
};

let contactInfo = { navn: '', epost: '', postnummer: '', adresse: '' };

// Elements
const progressSteps = document.querySelectorAll('.progress-step');
const questionCards = document.querySelectorAll('.question-card');
const resultCard = document.querySelector('.result-card');
const speedometer = document.getElementById('speedometer');
const speedValue = document.getElementById('speed-value');
const speedNumber = document.getElementById('speed-number');
const speedBadge = document.getElementById('speed-badge');
const needle = document.getElementById('gauge-needle');
const arcFill = document.getElementById('gauge-fill');
const speedMarkers = document.querySelectorAll('.speedometer-marker');

// HubSpot submission logic using Submissions API (v3)
async function submitToHubSpot() {
    const portalId = "143320734";
    const formId = "16643d38-d1f1-42a8-a19c-cb881062d4a7";
    const endpoint = `https://api-eu1.hsforms.com/submissions/v3/integration/submit/${portalId}/${formId}`;

    // Get HubSpot tracking cookie
    const hubspotutk = document.cookie.match(/hubspotutk=([^;]+)/)?.[1];

    // Determine product choice
    const productChoice = answers[0]?.values?.[0] === 'tv-internet' ? 'TV og Internett' : 'Kun Internett';
    const recommendation = calculateRecommendation();

    const data = {
        fields: [
            { name: "firstname", value: contactInfo.navn },
            { name: "email", value: contactInfo.epost },
            { name: "zip", value: contactInfo.postnummer },
            { name: "address", value: contactInfo.adresse },
            { name: "message", value: `Forespørsel fra rådgiver: Ønsker ${productChoice}. Anbefaling: ${recommendation.name} (${recommendation.speed}).` }
        ],
        context: {
            hutk: hubspotutk,
            pageUri: window.location.href,
            pageName: document.title
        }
    };

    try {
        console.log('Submitting to HubSpot API...');
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            console.log('HubSpot submission successful');
        } else {
            console.error('HubSpot submission failed');
        }
    } catch (error) {
        console.error('Error during HubSpot submission:', error);
    }
}

// Initialize
function init() {
    setupOptionListeners();
    setupNavigationListeners();
    setupContactFormListeners();
    updateSpeedometer(0);
}

function setupOptionListeners() {
    document.querySelectorAll('.options').forEach(optionsContainer => {
        const isMulti = optionsContainer.dataset.multi === 'true';

        optionsContainer.querySelectorAll('.option').forEach(option => {
            option.addEventListener('click', () => {
                if (isMulti) {
                    option.classList.toggle('selected');
                    updateNextButton();
                } else {
                    optionsContainer.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
                    option.classList.add('selected');
                    updateNextButton();

                    // Auto-advance for single-select (except the very first and last questions for better UX)
                    if (currentQuestion < 5) {
                        setTimeout(() => {
                            saveAnswer();
                            goToQuestion(currentQuestion + 1);
                        }, 400);
                    }
                }
                updateLiveSpeed();
            });
        });
    });
}

function setupContactFormListeners() {
    const inputs = ['navn', 'epost', 'postnummer', 'adresse'];
    const showResultBtn = document.getElementById('show-result-btn');

    function validateContactForm() {
        const navn = document.getElementById('navn').value.trim();
        const epost = document.getElementById('epost').value.trim();
        const address = document.getElementById('adresse').value.trim();
        const zip = document.getElementById('postnummer').value.trim();

        const isValid = navn.length >= 2 &&
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(epost) &&
            address.length >= 5 &&
            /^\d{4}$/.test(zip);

        showResultBtn.disabled = !isValid;

        contactInfo.navn = navn;
        contactInfo.epost = epost;
        contactInfo.adresse = address;
        contactInfo.postnummer = zip;
    }

    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', validateContactForm);
    });
}

function updateLiveSpeed() {
    let points = 0;

    // Points logic
    const persons = document.querySelector('.question-card[data-question="1"] .option.selected')?.dataset.value;
    const activities = Array.from(document.querySelectorAll('.question-card[data-question="2"] .option.selected')).map(o => o.dataset.value);
    const importance = document.querySelector('.question-card[data-question="3"] .option.selected')?.dataset.value;
    const frequency = document.querySelector('.question-card[data-question="4"] .option.selected')?.dataset.value;

    // People points
    if (persons === '1') points += 1;
    else if (persons === '2') points += 2;
    else if (persons === '3-4') points += 4;
    else if (persons === '5+') points += 6;

    // Activity points
    activities.forEach(acc => points += 1);

    // Importance & Frequency
    if (importance === 'important') points += 0.5;
    if (importance === 'critical') points += 1; // Stability requested

    if (frequency === 'sometimes') points += 1;
    if (frequency === 'often') points += 2;

    livePoints = points;
    updateSpeedometer(points);
}

function updateSpeedometer(points) {
    let speed, tier, badge, needleAngle;

    // More conservative thresholds:
    // < 7 points = 100 Mbps
    // 7-10 points = 500 Mbps
    // 11+ points = 1000 Mbps

    if (points < 7) {
        speed = 100;
        tier = '100';
        badge = 'Medium';
        // -90 to -45 based on points (0-7)
        needleAngle = -90 + (points * 6.4);
    } else if (points < 11) {
        speed = 500;
        tier = '500';
        badge = 'Standard';
        // -45 to +45 based on points (7-11)
        needleAngle = -45 + ((points - 7) * 22.5);
    } else {
        speed = 1000;
        tier = '1000';
        badge = 'Extra';
        // +45 to +90 based on points (11-14)
        needleAngle = 45 + Math.min((points - 11) * 15, 45);
    }

    const speedometerEl = document.getElementById('speedometer');
    if (speedometerEl) {
        if (speed > currentTier) {
            speedometerEl.classList.add('tier-up');
            setTimeout(() => speedometerEl.classList.remove('tier-up'), 600);
        } else if (speed < currentTier) {
            speedometerEl.classList.add('tier-down');
            setTimeout(() => speedometerEl.classList.remove('tier-down'), 400);
        }
    }

    currentTier = speed;

    // Update needle (ensuring it reaches the end for 1000)
    // -90 is 100, 0 is 500, 90 is 1000
    if (needle) needle.style.transform = `rotate(${needleAngle}deg)`;

    // Update arc fill
    if (arcFill) {
        const fillPercent = (needleAngle + 90) / 180;
        const dashOffset = 283 * (1 - fillPercent);
        arcFill.style.strokeDashoffset = dashOffset;
    }

    if (speedNumber) speedNumber.textContent = speed;
    if (speedBadge) {
        speedBadge.textContent = badge === 'Standard' ? 'Standard' : (badge === 'Extra' ? 'Extra' : 'Medium');
        speedBadge.className = 'speed-tier-badge tier-' + tier;
    }

    speedMarkers.forEach(marker => {
        const mSpeed = parseInt(marker.dataset.speed);
        marker.classList.toggle('active', mSpeed <= speed);
    });
}

function setupNavigationListeners() {
    document.querySelectorAll('.btn-next').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!btn.disabled) {
                if (currentQuestion < totalQuestions) {
                    saveAnswer();
                    goToQuestion(currentQuestion + 1);
                } else if (currentQuestion === totalQuestions) {
                    showResult();
                }
            }
        });
    });

    document.querySelectorAll('.btn-back').forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentQuestion > 0) {
                goToQuestion(currentQuestion - 1);
            }
        });
    });
}

function updateNextButton() {
    const currentCard = document.querySelector(`.question-card[data-question="${currentQuestion}"]`);
    if (!currentCard) return;

    const selectedOptions = currentCard.querySelectorAll('.option.selected');
    const nextBtn = currentCard.querySelector('.btn-next');

    if (nextBtn) {
        nextBtn.disabled = selectedOptions.length === 0;
    }
}

function saveAnswer() {
    const currentCard = document.querySelector(`.question-card[data-question="${currentQuestion}"]`);
    if (!currentCard) return;

    const selectedOptions = currentCard.querySelectorAll('.option.selected');
    answers[currentQuestion] = {
        values: Array.from(selectedOptions).map(o => o.dataset.value),
        points: Array.from(selectedOptions).reduce((acc, o) => acc + (parseFloat(o.dataset.points) || 0), 0)
    };
}

function goToQuestion(questionNum) {
    progressSteps.forEach((step, index) => {
        step.classList.toggle('completed', index < questionNum);
        step.classList.toggle('active', index === questionNum);
    });

    questionCards.forEach(card => {
        card.classList.toggle('active', parseInt(card.dataset.question) === questionNum);
    });

    currentQuestion = questionNum;
    updateNextButton();
    updateLiveSpeed();

    // Hide speedometer if we are on the intro question
    if (speedometer) {
        speedometer.style.display = questionNum === 0 ? 'none' : 'block';
    }
}

function showResult() {
    submitToHubSpot();

    questionCards.forEach(card => card.classList.remove('active'));
    if (speedometer) speedometer.style.display = 'none';
    if (resultCard) resultCard.classList.add('active');

    progressSteps.forEach(step => {
        step.classList.remove('active');
        step.classList.add('completed');
    });

    const recommendation = calculateRecommendation();
    displayResult(recommendation);
    launchConfetti();
}

function launchConfetti() {
    const container = document.getElementById('confetti-container');
    if (!container) return;

    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = ['#ee4238', '#ff6b5b', '#ffd700', '#4299e1'][Math.floor(Math.random() * 4)];
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        confetti.style.animationDuration = (2 + Math.random() * 2) + 's';
        container.appendChild(confetti);
        setTimeout(() => confetti.remove(), 4000);
    }
}

function calculateRecommendation() {
    const productType = answers[0]?.values?.[0] || 'tv-internet';
    let tier;

    if (livePoints >= 11) tier = 1000;
    else if (livePoints >= 7) tier = 500;
    else tier = 100;

    const pkg = packages[productType][tier];
    return {
        tier: tier,
        name: pkg.name,
        speed: pkg.speed,
        features: pkg.features,
        reasons: generateReasons(tier, productType)
    };
}

function generateReasons(tier, type) {
    const reasons = [];
    const persons = document.querySelector('.question-card[data-question="1"] .option.selected')?.dataset.value;
    const activities = Array.from(document.querySelectorAll('.question-card[data-question="2"] .option.selected')).map(o => o.dataset.value);

    if (tier === 100) {
        reasons.push('Perfekt for mindre husstander med vanlig bruk');
        reasons.push('Rimelig og stabil fiberlinje');
    } else if (tier === 500) {
        if (persons === '3-4' || persons === '5+') reasons.push('Ideell kapasitet for flere brukere samtidig');
        if (activities.includes('streaming')) reasons.push('Flere kan strømme 4K samtidig uten hakking');
        if (activities.includes('gaming')) reasons.push('Garantert kapasitet selv når andre strømmer samtidig');
    } else if (tier === 1000) {
        reasons.push('Ubegrenset kapasitet for dine behov');
        reasons.push('Vår aller raskeste linje - null kompromiss');
        if (activities.includes('gaming')) reasons.push('Lynrask nedlasting av spill og maksimal stabilitet');
    }

    if (type === 'tv-internet') {
        reasons.push('Inkluderer full TV-pakke med stor fleksibilitet');
    }

    return reasons.slice(0, 4);
}

function displayResult(recommendation) {
    const pkgName = document.getElementById('result-package-name');
    const pkgSpeed = document.getElementById('result-speed');
    const featuresList = document.getElementById('result-features-list');
    const reasonsList = document.getElementById('result-reasons-list');

    if (pkgName) pkgName.textContent = recommendation.name;
    if (pkgSpeed) pkgSpeed.textContent = recommendation.speed + ' opp og ned';

    if (featuresList) {
        featuresList.innerHTML = recommendation.features.map(f => `<li>${f}</li>`).join('');
    }
    if (reasonsList) {
        reasonsList.innerHTML = recommendation.reasons.map(r => `<li>${r}</li>`).join('');
    }
}

function restartQuiz() {
    location.reload(); // Simplest way to reset all state correctly
}

// Start
document.addEventListener('DOMContentLoaded', init);
