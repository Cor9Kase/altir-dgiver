// State
let currentQuestion = 0;
const totalQuestions = 5;
let answers = {};
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
                'Internett 100 Mbps opp og ned',
                'Programarkiv og start forfra',
                '500 timer opptak',
                'Strømme og ta opp 4K-innhold',
                'Velg underholdningspakker som Netflix, Max, Viaplay, TV2 Play og SkyShowtime',
                'Altibox-appen med søk, anbefalinger, film/serier og se offline'
            ]
        },
        500: {
            name: 'Altibox Standard',
            speed: '500 Mbps',
            features: [
                'TV-pakke med 60 valgfrie poeng',
                'Internett 500 Mbps opp og ned',
                'Programarkiv og start forfra',
                '500 timer opptak',
                'Strømme og ta opp 4K-innhold',
                'Velg underholdningspakker som Netflix, Max, Viaplay, TV2 Play og SkyShowtime',
                'Altibox-appen med søk, anbefalinger, film/serier og se offline'
            ]
        },
        1000: {
            name: 'Altibox Extra',
            speed: '1000 Mbps',
            features: [
                'TV-pakke med 110 valgfrie poeng',
                'Internett 1000 Mbps opp og ned',
                'Programarkiv og start forfra',
                '500 timer opptak',
                'Strømme og ta opp 4K-innhold',
                'Velg underholdningspakker som Netflix, Max, Viaplay, TV2 Play og SkyShowtime',
                'Altibox-appen med søk, anbefalinger, film/serier og se offline'
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
                'Passer for 1-2 personer med vanlig bruk',
                'Ingen datakvoter'
            ]
        },
        500: {
            name: 'Fiber 500',
            speed: '500 Mbps',
            features: [
                'Lynraskt internett for hele hjemmet',
                'Symmetrisk hastighet 500/500 Mbps',
                'Takler flere samtidige brukere',
                'Passer for streaming, gaming og hjemmekontor'
            ]
        },
        1000: {
            name: 'Fiber 1000',
            speed: '1000 Mbps',
            features: [
                'Maks kapasitet 1000/1000 Mbps',
                'Laget for høy og jevn belastning',
                'Kort ventetid på store nedlastinger',
                'God margin for fremtidige behov'
            ]
        }
    }
};

let contactInfo = {
    navn: '',
    epost: '',
    telefon: '',
    postnummer: ''
};

const ALLOWED_ZIP_EXACT = new Set([
    '4420', '4460', '4462', '4463', '4465',
    '4580', '4733', '4734', '4735', '4737',
    '4741', '4742', '4744', '4745', '4746', '4747', '4748', '4749',
    '4754', '4755', '4756',
    '4380', '4381',
    '4378', '4379'
]);

function inRange(zip, min, max) {
    const num = Number(zip);
    return Number.isInteger(num) && num >= min && num <= max;
}

function isAllowedZip(zip) {
    if (!/^\d{4}$/.test(zip)) return false;
    if (ALLOWED_ZIP_EXACT.has(zip)) return true;

    return (
        inRange(zip, 4604, 4639) ||
        inRange(zip, 4513, 4519) ||
        inRange(zip, 4400, 4438) ||
        inRange(zip, 4550, 4563) ||
        inRange(zip, 4700, 4707) ||
        inRange(zip, 4370, 4376)
    );
}

// Elements
const progressSteps = document.querySelectorAll('.progress-step');
const questionCards = document.querySelectorAll('.question-card');
const resultCard = document.querySelector('.result-card');
const speedometer = document.getElementById('speedometer');
const speedNumber = document.getElementById('speed-number');
const speedBadge = document.getElementById('speed-badge');
const needle = document.getElementById('gauge-needle');
const arcFill = document.getElementById('gauge-fill');
const speedMarkers = document.querySelectorAll('.speedometer-marker');

function getSurveyContext() {
    return {
        productType: document.querySelector('.question-card[data-question="0"] .option.selected')?.dataset.value || 'tv-internet',
        persons: document.querySelector('.question-card[data-question="1"] .option.selected')?.dataset.value,
        activities: Array.from(document.querySelectorAll('.question-card[data-question="2"] .option.selected')).map(o => o.dataset.value),
        frequency: document.querySelector('.question-card[data-question="3"] .option.selected')?.dataset.value,
        stability: document.querySelector('.question-card[data-question="4"] .option.selected')?.dataset.value
    };
}

function scoreFromContext(ctx) {
    let points = 0;

    if (ctx.persons === '1') points += 1;
    else if (ctx.persons === '2') points += 2;
    else if (ctx.persons === '3-4') points += 4;
    else if (ctx.persons === '5+') points += 5;

    if (ctx.frequency === 'sometimes') points += 1;
    if (ctx.frequency === 'often') points += 2;

    if (ctx.activities.includes('streaming')) points += 2;
    if (ctx.activities.includes('gaming')) points += 1;
    if (ctx.activities.includes('hjemmekontor')) points += 1;
    if (ctx.activities.includes('smarthus')) points += 1;
    if (ctx.activities.includes('downloads')) points += 1;

    if (ctx.stability === 'critical') points += 1;

    return points;
}

function tierFromContext(ctx, points) {
    let tier = 100;

    if (points >= 10) tier = 1000;
    else if (points >= 6) tier = 500;

    const hasHighUsagePattern = ctx.activities.includes('streaming') && ctx.activities.includes('hjemmekontor') && ctx.activities.includes('gaming');

    if (tier === 1000) {
        const valid1000 = ctx.persons === '5+' || ctx.frequency === 'often' || hasHighUsagePattern;
        if (!valid1000) tier = 500;
    }

    if (ctx.persons === '1' && !ctx.activities.includes('streaming') && ctx.frequency !== 'often') {
        tier = Math.min(tier, 500);
    }

    return tier;
}

function tierMeta(speed) {
    if (speed === 1000) return { tier: '1000', badge: 'Extra' };
    if (speed === 500) return { tier: '500', badge: 'Standard' };
    return { tier: '100', badge: 'Medium' };
}

async function submitToHubSpot() {
    const portalId = '143320734';
    const formId = '16643d38-d1f1-42a8-a19c-cb881062d4a7';
    const endpoint = `https://api-eu1.hsforms.com/submissions/v3/integration/submit/${portalId}/${formId}`;

    const hubspotutk = document.cookie.match(/hubspotutk=([^;]+)/)?.[1];
    const productChoice = answers[0]?.values?.[0] === 'tv-internet' ? 'TV og Internett' : 'Kun Internett';
    const recommendation = calculateRecommendation();

    const data = {
        fields: [
            { name: 'firstname', value: contactInfo.navn },
            { name: 'email', value: contactInfo.epost },
            { name: 'phone', value: contactInfo.telefon },
            { name: 'zip', value: contactInfo.postnummer },
            {
                name: 'message',
                value: `Forespørsel fra rådgiver: Ønsker ${productChoice}. Anbefaling: ${recommendation.name} (${recommendation.speed}). Postnummer: ${contactInfo.postnummer}.`
            }
        ],
        context: {
            hutk: hubspotutk,
            pageUri: window.location.href,
            pageName: document.title
        }
    };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            console.error('HubSpot submission failed');
        }
    } catch (error) {
        console.error('Error during HubSpot submission:', error);
    }
}

function init() {
    setupOptionListeners();
    setupNavigationListeners();
    setupContactFormListeners();
    updateSpeedometer(0, 100);
    goToQuestion(0);
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

                    if (currentQuestion < totalQuestions) {
                        setTimeout(() => {
                            saveAnswer();
                            goToQuestion(currentQuestion + 1);
                        }, 350);
                    }
                }
                updateLiveSpeed();
            });
        });
    });
}

function setupContactFormListeners() {
    const showResultBtn = document.getElementById('show-result-btn');
    const navnInput = document.getElementById('navn');
    const epostInput = document.getElementById('epost');
    const telefonInput = document.getElementById('telefon');
    const postnummerInput = document.getElementById('postnummer');
    const postnummerStatus = document.getElementById('postnummer-status');

    function validateContactForm() {
        const navn = navnInput?.value.trim() || '';
        const epost = epostInput?.value.trim() || '';
        const telefon = telefonInput?.value.trim() || '';
        const postnummer = postnummerInput?.value.trim() || '';

        const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(epost);
        const validZipFormat = /^\d{4}$/.test(postnummer);
        const validZip = isAllowedZip(postnummer);

        if (postnummerStatus) {
            if (!postnummer) {
                postnummerStatus.textContent = '';
            } else if (!validZipFormat) {
                postnummerStatus.textContent = 'Postnummer må være 4 siffer.';
            } else if (!validZip) {
                postnummerStatus.textContent = 'Postnummeret er utenfor Altifiber sitt leveringsområde.';
            } else {
                postnummerStatus.textContent = 'Postnummer er innenfor godkjent område.';
            }
            postnummerStatus.style.color = validZip ? '#15803d' : 'var(--gray-text)';
        }

        const isValid = navn.length >= 2 && validEmail && validZip;
        if (showResultBtn) showResultBtn.disabled = !isValid;

        contactInfo.navn = navn;
        contactInfo.epost = epost;
        contactInfo.telefon = telefon;
        contactInfo.postnummer = postnummer;
    }

    if (navnInput) navnInput.addEventListener('input', validateContactForm);
    if (epostInput) epostInput.addEventListener('input', validateContactForm);
    if (telefonInput) telefonInput.addEventListener('input', validateContactForm);
    if (postnummerInput) postnummerInput.addEventListener('input', validateContactForm);
}

function updateLiveSpeed() {
    const ctx = getSurveyContext();
    const points = scoreFromContext(ctx);
    const speed = tierFromContext(ctx, points);

    livePoints = points;
    updateSpeedometer(points, speed);
}

function updateSpeedometer(points, speed) {
    let needleAngle;

    if (points <= 6) {
        needleAngle = -90 + (points / 6) * 55;
    } else if (points <= 10) {
        needleAngle = -35 + ((points - 6) / 4) * 70;
    } else {
        needleAngle = 35 + Math.min(((points - 10) / 4) * 55, 55);
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

    if (needle) needle.style.transform = `rotate(${needleAngle}deg)`;

    if (arcFill) {
        const fillPercent = (needleAngle + 90) / 180;
        const dashOffset = 283 * (1 - fillPercent);
        arcFill.style.strokeDashoffset = dashOffset;
    }

    if (speedNumber) speedNumber.textContent = speed;

    const meta = tierMeta(speed);
    if (speedBadge) {
        speedBadge.textContent = meta.badge;
        speedBadge.className = 'speed-tier-badge tier-' + meta.tier;
    }

    speedMarkers.forEach(marker => {
        const markerSpeed = parseInt(marker.dataset.speed, 10);
        marker.classList.toggle('active', markerSpeed <= speed);
    });
}

function setupNavigationListeners() {
    document.querySelectorAll('.btn-next').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.disabled) return;

            if (currentQuestion < totalQuestions) {
                saveAnswer();
                goToQuestion(currentQuestion + 1);
            } else if (currentQuestion === totalQuestions) {
                showResult();
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

    const nextBtn = currentCard.querySelector('.btn-next');
    if (!nextBtn) return;

    if (currentQuestion === 5) {
        const navn = document.getElementById('navn')?.value.trim() || '';
        const epost = document.getElementById('epost')?.value.trim() || '';
        const postnummer = document.getElementById('postnummer')?.value.trim() || '';
        nextBtn.disabled = !(navn.length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(epost) && isAllowedZip(postnummer));
        return;
    }

    const selectedOptions = currentCard.querySelectorAll('.option.selected');
    nextBtn.disabled = selectedOptions.length === 0;
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
        card.classList.toggle('active', parseInt(card.dataset.question, 10) === questionNum);
    });

    currentQuestion = questionNum;
    updateNextButton();
    updateLiveSpeed();

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

    for (let i = 0; i < 50; i += 1) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = ['#ee4238', '#ff6b5b', '#ffd700', '#4299e1'][Math.floor(Math.random() * 4)];
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        confetti.style.animationDuration = 2 + Math.random() * 2 + 's';
        container.appendChild(confetti);
        setTimeout(() => confetti.remove(), 4000);
    }
}

function calculateRecommendation() {
    const ctx = getSurveyContext();
    const points = scoreFromContext(ctx);
    const tier = tierFromContext(ctx, points);
    const pkg = packages[ctx.productType][tier];

    return {
        tier,
        name: pkg.name,
        speed: pkg.speed,
        features: pkg.features,
        reasons: generateReasons(tier, ctx, points)
    };
}

function generateReasons(tier, ctx, points) {
    const reasons = [];

    if (tier === 100) {
        reasons.push('Anbefaling for vanlig bruk og lav samtidig belastning.');
    }

    if (tier === 500) {
        reasons.push('Anbefaling for flere brukere og jevn hverdagstrafikk.');
        if (ctx.activities.includes('streaming')) {
            reasons.push('God kapasitet når flere strømmer samtidig.');
        }
    }

    if (tier === 1000) {
        reasons.push('Anbefaling ved høy samtidig bruk og stort kapasitetsbehov.');
        reasons.push('Gir ekstra margin når mange enheter er aktive samtidig.');
    }

    if (ctx.stability === 'critical' && points < 10) {
        reasons.push('Stabilitet påvirkes også av WiFi og tjenestene du bruker, ikke bare Mbps.');
    }

    if (ctx.productType === 'tv-internet') {
        reasons.push('TV-innhold og tilgjengelige tillegg bekreftes i det endelige tilbudet.');
    }

    reasons.push('Endelig anbefaling bekreftes etter kontroll av adresse og postnummer.');

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
        featuresList.innerHTML = recommendation.features.map(feature => `<li>${feature}</li>`).join('');
    }

    if (reasonsList) {
        reasonsList.innerHTML = recommendation.reasons.map(reason => `<li>${reason}</li>`).join('');
    }
}

function restartQuiz() {
    location.reload();
}

// Start
document.addEventListener('DOMContentLoaded', init);
