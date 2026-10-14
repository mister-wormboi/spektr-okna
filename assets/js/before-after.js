document.querySelectorAll('.balcony-comparison').forEach(comparison => {
  const range = comparison.querySelector('.comparison-range');
  const update = () => {
    const value = Math.min(100, Math.max(0, Number(range.value)));
    comparison.style.setProperty('--split', `${value}%`);
    range.setAttribute('aria-valuetext', `До: ${value}%, после: ${100 - value}%`);
  };
  range.addEventListener('input', update);
  update();
});
