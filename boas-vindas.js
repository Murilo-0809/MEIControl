/* MEIControl - boas-vindas.js (dados cadastrais / configurações) */

function mostrarDadosUsuario() {
  const u = usuarioAtual();
  const primeiroNome = String(u.nome).trim().split(' ')[0];
  document.getElementById('nome-titulo').textContent = primeiroNome;
  document.getElementById('dado-nome').textContent = u.nome;
  document.getElementById('dado-negocio').textContent = u.negocio;
  document.getElementById('dado-cnpj').textContent = u.cnpj;
  document.getElementById('dado-ramo').textContent = u.ramo;
  document.getElementById('dado-das').textContent = 'DAS estimado: ' + formatarMoeda(valorDAS(u.ramo)) + '/mês';
  document.getElementById('dado-email').textContent = u.email;
  document.getElementById('dado-plano').textContent = 'Plano ' + (u.plano || 'Gratuito') + ' Ativo';
}

function abrirEdicaoCadastro() {
  const u = usuarioAtual();
  const modal = abrirModal('Editar informações',
    '<form id="form-editar" novalidate>' +
      '<div class="campo"><label for="ed-nome">Nome completo</label><input id="ed-nome" maxlength="60" value="' + escaparHTML(u.nome) + '"><span class="erro-campo"></span></div>' +
      '<div class="campo"><label for="ed-negocio">Nome do negócio</label><input id="ed-negocio" maxlength="60" value="' + escaparHTML(u.negocio) + '"><span class="erro-campo"></span></div>' +
      '<div class="linha-campos">' +
        '<div class="campo"><label for="ed-cnpj">CNPJ</label><input id="ed-cnpj" maxlength="18" inputmode="numeric" value="' + escaparHTML(u.cnpj) + '"><span class="erro-campo"></span></div>' +
        '<div class="campo"><label for="ed-ramo">Ramo ou atividade</label><input id="ed-ramo" list="sug-ramo" maxlength="60" value="' + escaparHTML(u.ramo) + '"><span class="erro-campo"></span>' +
        '<datalist id="sug-ramo"><option value="Comércio"><option value="Prestação de serviços"><option value="Comércio e serviços"><option value="Indústria"><option value="Alimentação"></datalist></div>' +
      '</div>' +
      '<div class="campo"><label for="ed-email">E-mail</label><input id="ed-email" type="email" value="' + escaparHTML(u.email) + '"><span class="erro-campo"></span></div>' +
      '<div class="modal-acoes"><button type="button" class="botao botao-secundario" data-fechar>Cancelar</button>' +
      '<button type="submit" class="botao botao-primario">Salvar alterações</button></div>' +
    '</form>', true);

  const campoCNPJ = modal.querySelector('#ed-cnpj');
  campoCNPJ.addEventListener('input', function () { campoCNPJ.value = mascararCNPJ(campoCNPJ.value); });

  modal.querySelector('form').addEventListener('submit', function (evento) {
    evento.preventDefault();
    const usuarios = lerUsuarios();
    const novo = {
      nome: modal.querySelector('#ed-nome').value.trim(),
      negocio: modal.querySelector('#ed-negocio').value.trim(),
      cnpj: campoCNPJ.value.trim(),
      ramo: modal.querySelector('#ed-ramo').value.trim(),
      email: modal.querySelector('#ed-email').value.trim().toLowerCase()
    };

    let ok = true;
    function erro(id, mensagem) {
      const campo = modal.querySelector(id).closest('.campo');
      campo.classList.toggle('invalido', Boolean(mensagem));
      campo.querySelector('.erro-campo').textContent = mensagem;
      if (mensagem) ok = false;
    }
    erro('#ed-nome', novo.nome.length < 3 ? 'Informe seu nome.' : '');
    erro('#ed-negocio', novo.negocio.length < 2 ? 'Informe o nome do negócio.' : '');
    erro('#ed-cnpj', !validarCNPJ(novo.cnpj) ? 'CNPJ inválido.' : '');
    erro('#ed-ramo', novo.ramo.length < 3 ? 'Informe o ramo.' : '');
    const emailUsado = usuarios.some(function (x) { return x.email === novo.email && x.id !== u.id; });
    erro('#ed-email', !emailValido(novo.email) ? 'E-mail inválido.' : (emailUsado ? 'E-mail já usado por outra conta.' : ''));
    if (!ok) return;

    // Atualiza o usuário dentro do array e salva de novo
    const posicao = usuarios.findIndex(function (x) { return x.id === u.id; });
    usuarios[posicao] = Object.assign(usuarios[posicao], novo);
    salvarUsuarios(usuarios);
    fecharModal(modal);
    mostrarDadosUsuario();
    mostrarAviso('Informações atualizadas.', 'sucesso');
  });
}

document.addEventListener('DOMContentLoaded', function () {
  const usuario = exigirLogin();
  if (!usuario) return;

  // Na primeira visita mostra "Conta criada"; depois a página funciona como Configurações
  if (usuario.boasVindasVista) {
    document.getElementById('selo-conta').textContent = 'Conta ativa';
    document.getElementById('texto-boas-vindas').textContent = 'Confira e atualize as informações cadastradas do seu negócio sempre que precisar.';
    document.title = 'Configurações do MEI - MEIControl';
  } else {
    const usuarios = lerUsuarios();
    const posicao = usuarios.findIndex(function (x) { return x.id === usuario.id; });
    usuarios[posicao].boasVindasVista = true;
    salvarUsuarios(usuarios);
  }

  mostrarDadosUsuario();
  document.getElementById('botao-editar').addEventListener('click', abrirEdicaoCadastro);
});
