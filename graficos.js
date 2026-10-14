function desenharGraficoLinha(elemento, valores, rotulos, vazio) {
  const temDados = valores.some(function (v) { return v !== 0; });
  if (!temDados) {
    elemento.innerHTML = '<div class="grafico-vazio">' + icone('barras') + '<span>' + vazio + '</span></div>';
    return;
  }

  // Limites do eixo Y (sempre inclui o zero)
  let maximo = Math.max.apply(null, valores.concat([0]));
  let minimo = Math.min.apply(null, valores.concat([0]));
  if (maximo === minimo) maximo = minimo + 1;
  const folga = (maximo - minimo) * 0.1;
  maximo += folga;
  if (minimo < 0) minimo -= folga;

  const largura = 100;
  const altura = 100;
  const pontos = valores.map(function (v, i) {
    const x = valores.length === 1 ? 50 : (i / (valores.length - 1)) * largura;
    const y = altura - ((v - minimo) / (maximo - minimo)) * altura;
    return [x, y];
  });

  // Curva suave: liga os pontos com curvas de Bézier
  let caminho = 'M' + pontos[0][0] + ',' + pontos[0][1];
  for (let i = 1; i < pontos.length; i++) {
    const anterior = pontos[i - 1];
    const atual = pontos[i];
    const meioX = (anterior[0] + atual[0]) / 2;
    caminho += ' C' + meioX + ',' + anterior[1] + ' ' + meioX + ',' + atual[1] + ' ' + atual[0] + ',' + atual[1];
  }
  const area = caminho + ' L' + largura + ',' + altura + ' L0,' + altura + ' Z';
  const idGradiente = 'grad-' + Math.random().toString(36).slice(2, 8);

  // Linhas de grade e valores do eixo Y (3 níveis)
  let grade = '';
  for (let n = 0; n <= 2; n++) {
    const valorLinha = maximo - ((maximo - minimo) / 2) * n;
    const topo = (n / 2) * 100;
    grade += '<div class="linha-grade" style="top:' + topo + '%"></div>' +
      '<span class="rotulo-y" style="top:' + topo + '%">' + abreviarValor(valorLinha) + '</span>';
  }

  // Mostra no máximo 6 rótulos no eixo X
  const passo = Math.max(1, Math.ceil(rotulos.length / 6));
  let rotulosX = '';
  rotulos.forEach(function (r, i) {
    if (i % passo === 0 || i === rotulos.length - 1) rotulosX += '<span>' + r + '</span>';
  });

  elemento.innerHTML =
    '<div class="grafico">' +
      '<div class="area-plot">' + grade +
        '<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' +
          '<defs><linearGradient id="' + idGradiente + '" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0%" stop-color="#3b82f6" stop-opacity="0.45"/>' +
            '<stop offset="100%" stop-color="#3b82f6" stop-opacity="0"/>' +
          '</linearGradient></defs>' +
          '<path d="' + area + '" fill="url(#' + idGradiente + ')"/>' +
          '<path d="' + caminho + '" fill="none" stroke="#3b82f6" stroke-width="2.5" vector-effect="non-scaling-stroke"/>' +
        '</svg>' +
      '</div>' +
      '<div class="rotulos-x">' + rotulosX + '</div>' +
    '</div>';
}

// 15300 -> "15,3k"
function abreviarValor(valor) {
  const absoluto = Math.abs(valor);
  if (absoluto >= 1000) return (valor / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'k';
  return Math.round(valor).toLocaleString('pt-BR');
}

// Cria um array com os últimos N dias (do mais antigo para hoje)
function ultimosDias(quantidade) {
  const dias = [];
  const hoje = new Date();
  for (let i = quantidade - 1; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - i);
    dias.push(dataParaISO(d));
  }
  return dias;
}

function rotuloCurto(iso) {
  const d = isoParaData(iso);
  return d.getDate() + ' ' + MESES_CURTOS[d.getMonth()];
}
