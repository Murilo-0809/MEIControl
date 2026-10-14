/* MEIControl - inicio.js (página de apresentação) */

document.addEventListener('DOMContentLoaded', function () {
  // Menu no celular
  const menu = document.getElementById('menu-landing');
  document.getElementById('botao-menu-landing').addEventListener('click', function () {
    menu.classList.toggle('aberto');
  });
  menu.addEventListener('click', function (evento) {
    if (evento.target.tagName === 'A') menu.classList.remove('aberto');
  });

  // Alternar entre preço mensal e anual
  const alternador = document.getElementById('alternar-plano');
  alternador.addEventListener('click', function (evento) {
    const botao = evento.target.closest('button');
    if (!botao) return;
    const periodo = botao.dataset.periodo;

    alternador.querySelectorAll('button').forEach(function (b) {
      b.classList.toggle('ativo', b === botao);
    });

    document.querySelectorAll('.plano').forEach(function (plano) {
      const preco = plano.querySelector('.preco');
      const valor = Number(preco.dataset[periodo]);
      preco.innerHTML = formatarMoeda(valor) + ' <small>/mês</small>';
      const cobranca = plano.querySelector('.cobranca');
      cobranca.textContent = (periodo === 'anual' && valor > 0)
        ? 'Cobrado anualmente: ' + formatarMoeda(valor * 12)
        : '';
    });
  });
});
