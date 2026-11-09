export function createVideoExhibit(host) {
  const callouts = {
    hardware: [[.12, 'Поворотно-откидная ручка'], [.42, 'Поворотное открывание'], [.72, 'Проветривание']],
    glass: [[.16, 'Наружное стекло'], [.43, 'Среднее стекло'], [.72, 'Внутреннее стекло']],
    profile: [[.16, 'Стена и проём'], [.43, 'Монтажный шов'], [.72, 'Подоконник']],
    frame: [[.16, 'Воздушные камеры'], [.43, 'Стальное усиление'], [.72, 'Контур уплотнения']]
  };
  const videos = new Map();
  let active;

  host.querySelectorAll('.inside-panel').forEach(panel => {
    const key = panel.dataset.part;
    const mount = document.createElement('div');
    mount.className = 'inside-webgl inside-video';
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.setAttribute('aria-hidden', 'true');
    video.src = `../assets/window-inside-video/${key}.mp4`;
    const label = document.createElement('div');
    label.className = 'inside-arrow-label inside-video-label';
    label.setAttribute('aria-hidden', 'true');
    mount.append(video, label);
    panel.querySelector('.inside-scene').append(mount);
    videos.set(panel, {video, label, mount, key});
    video.load();
  });

  function scroll(panel, progress) {
    if (!panel) return;
    active = panel;
    const item = videos.get(panel);
    const value = Math.max(0, Math.min(1, progress));
    const callout = [...callouts[item.key]].reverse().find(([threshold]) => value >= threshold);
    item.label.textContent = value >= .96 ? '' : callout?.[1] || '';
    item.label.style.display = item.label.textContent ? '' : 'none';
    if (!item.video.duration) return;
    const time = value * Math.max(0, item.video.duration - .05);
    if (Math.abs(item.video.currentTime - time) > .015) item.video.currentTime = time;
  }
  function update(panel = active || host.querySelector('.inside-panel')) {
    if (panel) scroll(panel, 0);
  }
  const ready = Promise.all([...videos.values()].map(({video, mount}) => new Promise((resolve, reject) => {
    const done = () => {
      video.currentTime = 0;
      mount.closest('.inside-scene').classList.add('has-3d');
      resolve();
    };
    if (video.readyState >= 2) done();
    else {
      video.addEventListener('loadeddata', done, {once: true});
      video.addEventListener('error', () => reject(new Error('Не удалось загрузить видео')), {once: true});
    }
  })));
  return {update, scroll, ready};
}
