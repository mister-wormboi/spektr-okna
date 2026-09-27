(() => {
  const experience = document.querySelector('.light-experience');
  if (!experience) return;
  const controls = experience.querySelector('.light-controls');
  const scene = experience.querySelector('.light-scene');
  controls.hidden = false;
  controls.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => {
      const isDay = button.dataset.scene === 'day';
      experience.dataset.light = button.dataset.scene;
      controls.querySelectorAll('button').forEach(item => {
        item.setAttribute('aria-pressed', String(item === button));
      });
      scene.setAttribute('aria-label', `Архитектурная иллюстрация: ${isDay ? 'солнечный' : 'вечерний'} свет через окно`);
    });
  });
})();
