(() => {
  'use strict';

  const form = document.getElementById('opportunity-survey');
  if (!form) return;

  const steps = Array.from(form.querySelectorAll('.survey-step'));
  const nextButton = document.getElementById('next-button');
  const backButton = document.getElementById('back-button');
  const submitButton = document.getElementById('submit-button');
  const message = document.getElementById('form-message');
  const progressLabel = document.getElementById('progress-label');
  const progressPercent = document.getElementById('progress-percent');
  const progressTrack = form.querySelector('[role="progressbar"]');
  const progressBar = document.getElementById('progress-bar');
  const feedback = document.getElementById('open_feedback');
  const characterCount = document.getElementById('character-count');
  const contactConsent = document.getElementById('contact_consent');
  let currentStep = 0;

  const params = new URLSearchParams(window.location.search);
  const source = params.get('source') || params.get('utm_source') || 'direct';
  document.getElementById('source').value = cleanTrackingValue(source);
  document.getElementById('utm_campaign').value = cleanTrackingValue(params.get('utm_campaign') || '');
  document.getElementById('utm_content').value = cleanTrackingValue(params.get('utm_content') || '');

  function cleanTrackingValue(value) {
    return String(value).trim().slice(0, 120).replace(/[^a-zA-Z0-9 _.-]/g, '');
  }

  function getChecked(group) {
    return Array.from(group.querySelectorAll('input[type="checkbox"]:checked'));
  }

  function setMessage(text = '') {
    message.textContent = text;
  }

  function validateStep(step) {
    setMessage();

    const requiredRadio = step.querySelector('input[type="radio"][required]');
    if (requiredRadio) {
      const selected = step.querySelector(`input[type="radio"][name="${CSS.escape(requiredRadio.name)}"]:checked`);
      if (!selected) {
        setMessage('Please select one answer before continuing.');
        focusFirstOption(step);
        return false;
      }
    }

    const requiredCheckboxGroup = step.querySelector('[data-required-group]');
    if (requiredCheckboxGroup && getChecked(requiredCheckboxGroup).length === 0) {
      setMessage('Please select at least one answer before continuing.');
      focusFirstOption(step);
      return false;
    }

    return true;
  }

  function focusFirstOption(step) {
    const first = step.querySelector('input, textarea');
    if (first) first.focus({ preventScroll: true });
  }

  function updateStep(shouldScroll = true) {
    steps.forEach((step, index) => step.classList.toggle('is-active', index === currentStep));

    const isFollowUp = currentStep === 9;
    const percent = isFollowUp ? 100 : Math.round(((currentStep + 1) / 9) * 100);
    progressLabel.textContent = isFollowUp ? 'Optional follow-up' : `Question ${currentStep + 1} of 9`;
    progressPercent.textContent = `${percent}%`;
    progressTrack.setAttribute('aria-valuenow', String(percent));
    progressBar.style.width = `${percent}%`;

    backButton.hidden = currentStep === 0;
    nextButton.hidden = isFollowUp;
    submitButton.hidden = !isFollowUp;
    setMessage();

    if (!shouldScroll) return;

    const activeStep = steps[currentStep];
    const heading = activeStep.querySelector('legend, h3');
    window.requestAnimationFrame(() => {
      activeStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    });
  }

  nextButton.addEventListener('click', () => {
    if (!validateStep(steps[currentStep])) return;
    if (currentStep < steps.length - 1) {
      currentStep += 1;
      updateStep();
    }
  });

  backButton.addEventListener('click', () => {
    if (currentStep > 0) {
      currentStep -= 1;
      updateStep();
    }
  });

  form.querySelectorAll('[data-max]').forEach(group => {
    const max = Number(group.dataset.max);
    group.addEventListener('change', event => {
      if (!(event.target instanceof HTMLInputElement) || event.target.type !== 'checkbox') return;
      const checked = getChecked(group);
      if (checked.length > max) {
        event.target.checked = false;
        setMessage(`Please select no more than ${max} answers for this question.`);
      } else {
        setMessage();
      }
    });
  });

  const followUpBoxes = Array.from(form.querySelectorAll('input[name="follow_up_interests[]"]'));
  const noFollowUp = followUpBoxes.find(box => box.value === 'No follow-up requested');
  followUpBoxes.forEach(box => {
    box.addEventListener('change', () => {
      if (!noFollowUp) return;
      if (box === noFollowUp && box.checked) {
        followUpBoxes.forEach(other => {
          if (other !== noFollowUp) other.checked = false;
        });
      } else if (box.checked) {
        noFollowUp.checked = false;
      }
    });
  });

  if (feedback && characterCount) {
    const updateCount = () => { characterCount.textContent = String(feedback.value.length); };
    feedback.addEventListener('input', updateCount);
    updateCount();
  }

  form.addEventListener('submit', event => {
    setMessage();

    for (let index = 0; index < 9; index += 1) {
      if (!validateStep(steps[index])) {
        event.preventDefault();
        currentStep = index;
        updateStep();
        return;
      }
    }

    const contactFields = ['first_name', 'last_name', 'business_name', 'email', 'telephone', 'website'];
    const hasContactDetails = contactFields.some(name => {
      const field = form.elements.namedItem(name);
      return field instanceof HTMLInputElement && field.value.trim().length > 0;
    });
    const hasFollowUpRequest = followUpBoxes.some(box => box.checked && box.value !== 'No follow-up requested');

    if ((hasContactDetails || hasFollowUpRequest) && !contactConsent.checked) {
      event.preventDefault();
      setMessage('Please authorize contact before submitting contact information or requesting follow-up. You may also remove the contact details and submit anonymously.');
      contactConsent.focus();
      return;
    }

    const email = form.elements.namedItem('email');
    if (email instanceof HTMLInputElement && email.value && !email.checkValidity()) {
      event.preventDefault();
      setMessage('Please enter a valid email address or leave the email field blank.');
      email.focus();
      return;
    }

    const website = form.elements.namedItem('website');
    if (website instanceof HTMLInputElement && website.value && !website.checkValidity()) {
      event.preventDefault();
      setMessage('Please enter a complete website address beginning with http:// or https://, or leave it blank.');
      website.focus();
      return;
    }

    document.getElementById('submitted_at').value = new Date().toISOString();
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting…';
  });

  updateStep(false);
})();