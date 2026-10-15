const menu = document.querySelector('.menu');
const navigation = document.querySelector('.links');
function closeMenu() {
  navigation.classList.remove('open');
  menu.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-label', 'Abrir menu');
}
menu.addEventListener('click', () => {
  const open = navigation.classList.toggle('open');
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeMenu();
});
document.querySelector('#year').textContent = new Date().getFullYear();
const form = document.querySelector('#form');
form.addEventListener('submit', event => {
  event.preventDefault();
  const service = document.querySelector('#service').value;
  if (!service) return;
  const car = document.querySelector('#car').value.trim();
  const details = document.querySelector('#details').value.trim();
  const message = 'Olá, RW! Gostaria de consultar um serviço.\nServiço: ' + service
    + (car ? '\nVeículo: ' + car : '') + (details ? '\nDetalhes: ' + details : '');
  window.open('https://wa.me/5555996185305?text=' + encodeURIComponent(message), '_blank', 'noopener,noreferrer');
});
