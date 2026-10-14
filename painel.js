/* MEIControl - painel.js (Visão geral) */

let mostrarTodas = false;

// Junta receitas e despesas em um só array, marcando o tipo de cada uma
function todasTransacoes() {
  const receitas = lerLista('receitas').map(function (r) { return Object.assign({ tipo: 'receitas' }, r); });
  const despesas = lerLista('despesas').map(function (d) { return Object.assign({ tipo: 'despesas' }, d); });
  return receitas.concat(despesas).sort(function (a, b) {
    if (a.data === b.data) return a.id < b.id ? 1 : -1;
    return a.data < b.data ? 1 : -1; // mais recentes primeiro
  });
}

function textoVariacao(elemento, atual, anterior, bomQuandoSobe) {
  const v = variacao(atual, anterior);
  if (v === null) {
    elemento.className = 'detalhe';
    elemento.textContent = atual > 0 ? 'Sem dados do mês anterior' : 'Nenhum lançamento no mês';
    return;
  }
  const subiu = v >= 0;
  const positivo = bomQuandoSobe ? subiu : !subiu;
  elemento.className = 'detalhe ' + (positivo ? 'verde' : 'vermelho');
  elemento.innerHTML = icone(subiu ? 'sobe' : 'desce') + (subiu ? '+' : '') + formatarPorcentagem(v) + ' vs mês anterior';
}

function atualizarIndicadores() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  const anterior = new Date(ano, mes - 1, 1);

  const receitas = apenasEfetivados(lerLista('receitas'));
  const despesas = apenasEfetivados(lerLista('despesas'));

  const recMes = somarValores(filtrarMes(receitas, ano, mes));
  const recAnt = somarValores(filtrarMes(receitas, anterior.getFullYear(), anterior.getMonth()));
  const desMes = somarValores(filtrarMes(despesas, ano, mes));
  const desAnt = somarValores(filtrarMes(despesas, anterior.getFullYear(), anterior.getMonth()));
  const saldo = somarValores(receitas) - somarValores(despesas);

  document.getElementById('ind-receitas').textContent = formatarMoeda(recMes);
  document.getElementById('ind-despesas').textContent = formatarMoeda(desMes);
  textoVariacao(document.getElementById('var-receitas'), recMes, recAnt, true);
  textoVariacao(document.getElementById('var-despesas'), desMes, desAnt, false);

  const elSaldo = document.getElementById('ind-saldo');
  elSaldo.textContent = formatarMoeda(saldo);
  const detSaldo = document.getElementById('det-saldo');
  if (saldo > 0) { detSaldo.textContent = 'Positivo'; detSaldo.className = 'detalhe verde'; }
  else if (saldo < 0) { detSaldo.textContent = 'Negativo'; detSaldo.className = 'detalhe vermelho'; }
  else { detSaldo.textContent = 'Sem movimentações'; detSaldo.className = 'detalhe'; }

  // Limite anual: soma do faturamento do ano (inclui receitas pendentes, pois já foram vendidas)
  const faturamentoAno = somarValores(filtrarAno(lerLista('receitas'), ano));
  const restante = Math.max(LIMITE_ANUAL_MEI - faturamentoAno, 0);
  document.getElementById('ind-limite').textContent = formatarMoeda(restante);
  const usado = (faturamentoAno / LIMITE_ANUAL_MEI) * 100;
  const detLimite = document.getElementById('det-limite');
  detLimite.textContent = formatarPorcentagem(usado) + ' utilizado' + (usado >= 100 ? ' — limite ultrapassado!' : '');
  detLimite.className = 'detalhe' + (usado >= 80 ? ' vermelho' : '');
}

function atualizarGraficoFluxo() {
  const quantidade = Number(document.getElementById('periodo-fluxo').value);
  document.getElementById('sub-fluxo').textContent = 'Evolução do saldo nos últimos ' + quantidade + ' dias';
  const dias = ultimosDias(quantidade);
  const receitas = apenasEfetivados(lerLista('receitas'));
  const despesas = apenasEfetivados(lerLista('despesas'));

  // Saldo que já existia antes do primeiro dia do gráfico
  let saldo = 0;
  receitas.forEach(function (r) { if (r.data < dias[0]) saldo += Number(r.valor); });
  despesas.forEach(function (d) { if (d.data < dias[0]) saldo -= Number(d.valor); });

  const valores = dias.map(function (dia) {
    receitas.forEach(function (r) { if (r.data === dia) saldo += Number(r.valor); });
    despesas.forEach(function (d) { if (d.data === dia) saldo -= Number(d.valor); });
    return Math.round(saldo * 100) / 100;
  });

  desenharGraficoLinha(document.getElementById('grafico-fluxo'), valores, dias.map(rotuloCurto),
    'Sem movimentações neste período.<br>Cadastre sua primeira receita ou despesa para ver o gráfico.');
}

function atualizarDAS() {
  const usuario = usuarioAtual();
  const das = proximoDAS();
  const prazo = document.getElementById('prazo-das');
  document.getElementById('valor-das').textContent = formatarMoeda(valorDAS(usuario.ramo));

  const competencia = MESES[das.competencia.getMonth()];
  if (das.pago) {
    prazo.textContent = 'Pago';
    prazo.className = 'etiqueta verde';
    document.getElementById('titulo-das').textContent = 'DAS de ' + competencia + ' pago';
    document.getElementById('texto-das').textContent = 'Pagamento registrado nas despesas. Seu MEI está em dia com a contribuição mensal.';
  } else {
    prazo.textContent = das.dias === 0 ? 'Vence hoje' : 'Em ' + das.dias + (das.dias === 1 ? ' dia' : ' dias');
    prazo.className = 'etiqueta ' + (das.dias <= 5 ? 'vermelho' : 'amarelo');
    document.getElementById('titulo-das').textContent = das.dias <= 10 ? 'Seu DAS vence em breve' : 'Próximo DAS';
    document.getElementById('texto-das').textContent = 'A guia de ' + competencia + ' vence no dia 20. Programe o pagamento para manter seu MEI regular e com os benefícios previdenciários ativos.';
  }
}

function atualizarTransacoes() {
  const lista = todasTransacoes();
  const corpo = document.getElementById('lista-transacoes');
  const vazio = document.getElementById('vazio-transacoes');
  const botaoVer = document.getElementById('ver-todas');
  const exibidas = mostrarTodas ? lista : lista.slice(0, 8);

  botaoVer.classList.toggle('oculto', lista.length <= 8);
  botaoVer.innerHTML = (mostrarTodas ? 'Ver menos' : 'Ver todas') + icone('chevronDireita');

  if (lista.length === 0) {
    corpo.innerHTML = '';
    vazio.innerHTML = '<div class="vazio"><span class="icone-caixa">' + icone('receitas') + '</span>Nenhuma transação registrada ainda.<br>Clique em <b>Nova transação</b> para começar.</div>';
    return;
  }
  vazio.innerHTML = '';

  corpo.innerHTML = exibidas.map(function (t) {
    const ehReceita = t.tipo === 'receitas';
    return '<tr>' +
      '<td class="celula-principal"><div class="desc"><span class="icone-caixa ' + (ehReceita ? 'verde' : 'vermelho') + '">' + icone(ehReceita ? 'entrada' : 'saida') + '</span>' +
        '<div><strong>' + escaparHTML(t.descricao) + '</strong>' + (t.status === 'Pendente' ? '<small class="amarelo">Pendente</small>' : '') + '</div></div></td>' +
      '<td data-rotulo="Categoria" class="mudo">' + escaparHTML(t.categoria) + '</td>' +
      '<td data-rotulo="Data" class="mudo">' + formatarData(t.data) + '</td>' +
      '<td data-rotulo="Valor" class="direita valor ' + (ehReceita ? 'verde' : 'vermelho') + '">' + (ehReceita ? '+ ' : '- ') + formatarMoeda(t.valor) + '</td>' +
      '<td data-rotulo="Ações"><div class="acoes-linha">' +
        '<button class="botao-icone" data-editar="' + t.id + '" data-tipo="' + t.tipo + '" aria-label="Editar">' + icone('lapis') + '</button>' +
        '<button class="botao-icone perigo" data-excluir="' + t.id + '" data-tipo="' + t.tipo + '" aria-label="Excluir">' + icone('lixeira') + '</button>' +
      '</div></td>' +
    '</tr>';
  }).join('');
}

function atualizarPainel() {
  atualizarIndicadores();
  atualizarGraficoFluxo();
  atualizarDAS();
  atualizarTransacoes();
  atualizarNotificacoes();
}

document.addEventListener('DOMContentLoaded', function () {
  if (!exigirLogin()) return;
  montarAreaLogada('painel', 'Aqui está o resumo do seu negócio hoje.', atualizarPainel);

  const hoje = new Date();
  document.getElementById('mes-atual').textContent = MESES[hoje.getMonth()] + ' de ' + hoje.getFullYear();

  document.getElementById('botao-nova-transacao').addEventListener('click', function () {
    abrirFormularioLancamento({ tipo: 'receitas', trocarTipo: true, aoSalvar: atualizarPainel });
  });
  document.getElementById('periodo-fluxo').addEventListener('change', atualizarGraficoFluxo);
  document.getElementById('botao-das').addEventListener('click', function () { abrirDetalhesDAS(atualizarPainel); });
  document.getElementById('ver-todas').addEventListener('click', function () {
    mostrarTodas = !mostrarTodas;
    atualizarTransacoes();
  });

  // Editar e excluir pela tabela (delegação de eventos)
  document.getElementById('lista-transacoes').addEventListener('click', function (evento) {
    const editar = evento.target.closest('[data-editar]');
    const excluir = evento.target.closest('[data-excluir]');
    if (editar) {
      const tipo = editar.dataset.tipo;
      const registro = lerLista(tipo).find(function (i) { return i.id === editar.dataset.editar; });
      if (registro) abrirFormularioLancamento({ tipo: tipo, registro: registro, aoSalvar: atualizarPainel });
    }
    if (excluir) {
      const tipo = excluir.dataset.tipo;
      confirmar('Deseja excluir este lançamento? Esta ação não pode ser desfeita.', function () {
        const lista = lerLista(tipo).filter(function (i) { return i.id !== excluir.dataset.excluir; });
        salvarLista(tipo, lista);
        mostrarAviso('Lançamento excluído.', 'sucesso');
        atualizarPainel();
      });
    }
  });

  atualizarPainel();
});
