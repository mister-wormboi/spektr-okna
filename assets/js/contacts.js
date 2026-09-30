(() => {
  const cards = [...document.querySelectorAll('.office-card')];
  const filterButtons = [...document.querySelectorAll('.filter-button')];

  const resultsStatus = document.querySelector('#resultsStatus');
  const emptyState = document.querySelector('#emptyState');

  let activeRegion = 'all';

  function updateCards() {
      let visibleCount = 0;

      cards.forEach((card) => {
          const matchesRegion =
              activeRegion === 'all' ||
              card.dataset.region === activeRegion;

          const isVisible = matchesRegion;

          card.hidden = !isVisible;

          if (isVisible) {
              visibleCount += 1;

          }
      });

      emptyState.hidden = visibleCount !== 0;

      resultsStatus.textContent = activeRegion !== 'all'
          ? `Офисов в выбранном регионе: ${visibleCount}`
          : '';
  }

  filterButtons.forEach((button) => {
      button.addEventListener('click', () => {
          activeRegion = button.dataset.filter;

          filterButtons.forEach((item) => {
              item.classList.toggle('is-active', item === button);
              item.setAttribute('aria-pressed', String(item === button));
          });

          updateCards();
      });
  });

  function timeToMinutes(time) {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
  }

  const workClock = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Moscow', weekday: 'short',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  });
  const workStatuses = [...document.querySelectorAll('.work-status')].map(status => ({
      element: status,
      schedule: Object.fromEntries(status.dataset.schedule.split(';').map(entry => {
          const separator = entry.indexOf(':');
          return [entry.slice(0, separator), entry.slice(separator + 1)];
      }))
  }));

  function updateWorkStatuses() {
      const dateParts = workClock.formatToParts(new Date());

      const getPart = (type) => {
          return dateParts.find((item) => item.type === type)?.value;
      };

      const weekday = getPart('weekday');

      const minutesNow =
          Number(getPart('hour')) * 60 +
          Number(getPart('minute'));

      let dayKey = 'weekday';

      if (weekday === 'Sat') {
          dayKey = 'sat';
      }

      if (weekday === 'Sun') {
          dayKey = 'sun';
      }

      workStatuses.forEach(({ element: status, schedule }) => {
          const interval = schedule[dayKey];
          let isOpen = false;

          if (interval) {
              const [start, end] = interval.split('-');

              isOpen =
                  minutesNow >= timeToMinutes(start) &&
                  minutesNow < timeToMinutes(end);
          }

          status.textContent = isOpen
              ? 'Открыто сейчас'
              : 'Сейчас закрыто';

          status.classList.toggle('is-open', isOpen);
      });
  }

  updateCards();

  let statusTimer;
  function scheduleWorkStatuses() {
      clearInterval(statusTimer);
      if (document.hidden) return;
      updateWorkStatuses();
      statusTimer = setInterval(updateWorkStatuses, 60_000);
  }
  document.addEventListener('visibilitychange', scheduleWorkStatuses);
  scheduleWorkStatuses();

  const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
  ).matches;

  const animatedElements = [
      {
          selector: '.section-heading',
          direction: ''
      },
      {
          selector: '.region-filters',
          direction: ''
      },
      {
          selector: '.results-status',
          direction: ''
      },
      {
          selector: '.contact-banner-inner > div',
          direction: 'reveal-left'
      },
      {
          selector: '.contact-banner-inner > a',
          direction: 'reveal-right'
      }
  ];

  const revealItems = [];

  animatedElements.forEach(({ selector, direction }) => {
      document.querySelectorAll(selector).forEach((element, index) => {
          element.classList.add('reveal');

          if (direction) {
              element.classList.add(direction);
          }

          element.style.transitionDelay =
              Math.min(index * 80, 240) + 'ms';

          revealItems.push(element);
      });
  });

  cards.forEach((card, index) => {
      card.classList.add('card-enter');
      card.style.animationDelay =
          Math.min(index * 60, 300) + 'ms';
  });

  if (
      reduceMotion ||
      !('IntersectionObserver' in window)
  ) {
      revealItems.forEach((element) => {
          element.classList.add('is-visible');
      });
  } else {
      const revealObserver = new IntersectionObserver(
          (entries, observer) => {
              entries.forEach((entry) => {
                  if (!entry.isIntersecting) {
                      return;
                  }

                  entry.target.classList.add('is-visible');
                  observer.unobserve(entry.target);
              });
          },
          {
              threshold: 0.14,
              rootMargin: '0px 0px -40px'
          }
      );

      revealItems.forEach((element) => {
          revealObserver.observe(element);
      });
  }
})();
