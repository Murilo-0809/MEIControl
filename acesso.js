/* ---------- CNPJ ---------- */
// Coloca a máscara 00.000.000/0000-00 enquanto o usuário digita
function mascararCNPJ(texto) {
  const n = texto.replace(/\D/g, '').slice(0, 14);
  let r = n.slice(0, 2);
  if (n.length > 2) r += '.' + n.slice(2, 5);
  if (n.length > 5) r += '.' + n.slice(5, 8);
  if (n.length > 8) r += '/' + n.slice(8, 12);
  if (n.length > 12) r += '-' + n.slice(12, 14);
  return r;
}

// Confere os dois dígitos verificadores do CNPJ
function validarCNPJ(texto) {
  const n = texto.replace(/\D/g, '');
  if (n.length !== 14 || /^(\d)\1+$/.test(n)) return false;

  function digito(base) {
    const pesos = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let soma = 0;
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * pesos[i];
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  }
  const d1 = digito(n.slice(0, 12));
  const d2 = digito(n.slice(0, 12) + d1);
  return n.endsWith('' + d1 + d2);
}

function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

// Mostra ou limpa a mensagem de erro embaixo de um campo
function marcarErro(idCampo, mensagem) {
  const campo = document.getElementById(idCampo).closest('.campo');
  campo.classList.toggle('invalido', Boolean(mensagem));
  campo.querySelector('.erro-campo').textContent = mensagem || '';
  return !mensagem;
}

/* ---------- Login ---------- */
function iniciarLogin() {
  const form = document.getElementById('form-login');
  const mensagem = document.getElementById('mensagem-login');

  // Se já está logado, vai direto para o painel
  if (usuarioAtual()) {
    window.location.href = 'painel.html';
    return;
  }

  // "Lembrar de mim" preenche o e-mail salvo
  const emailSalvo = lerDados('mei_lembrar_email', '');
  if (emailSalvo) {
    document.getElementById('email').value = emailSalvo;
    document.getElementById('lembrar').checked = true;
  }

  form.addEventListener('submit', function (evento) {
    evento.preventDefault();
    mensagem.textContent = '';
    mensagem.className = 'mensagem-form';

    const email = document.getElementById('email').value.trim().toLowerCase();
    const senha = document.getElementById('senha').value;

    let ok = marcarErro('email', emailValido(email) ? '' : 'Informe um e-mail válido.');
    ok = marcarErro('senha', senha ? '' : 'Informe sua senha.') && ok;
    if (!ok) return;

    const usuario = lerUsuarios().find(function (u) { return u.email === email; });
    if (!usuario || usuario.senha !== senha) {
      mensagem.textContent = 'E-mail ou senha incorretos.';
      return;
    }

    if (document.getElementById('lembrar').checked) {
      salvarDados('mei_lembrar_email', email);
    } else {
      localStorage.removeItem('mei_lembrar_email');
    }

    entrar(usuario.id);
    window.location.href = 'painel.html';
  });

  document.getElementById('esqueci-senha').addEventListener('click', abrirRecuperarSenha);
}

// Protótipo: redefine a senha direto pelo e-mail cadastrado
function abrirRecuperarSenha() {
  const modal = abrirModal('Redefinir senha',
    '<form id="form-recuperar" novalidate>' +
      '<p style="margin-bottom:14px">Informe o e-mail da conta e escolha uma nova senha.</p>' +
      '<div class="mensagem-form" id="msg-recuperar"></div>' +
      '<div class="campo"><label for="rec-email">E-mail</label><input id="rec-email" type="email" placeholder="voce@email.com"></div>' +
      '<div class="campo"><label for="rec-senha">Nova senha</label><input id="rec-senha" type="password" placeholder="Mínimo de 8 caracteres"></div>' +
      '<div class="modal-acoes"><button type="button" class="botao botao-secundario" data-fechar>Cancelar</button>' +
      '<button type="submit" class="botao botao-primario">Salvar nova senha</button></div>' +
    '</form>');

  modal.querySelector('form').addEventListener('submit', function (evento) {
    evento.preventDefault();
    const msg = modal.querySelector('#msg-recuperar');
    const email = modal.querySelector('#rec-email').value.trim().toLowerCase();
    const senha = modal.querySelector('#rec-senha').value;
    const usuarios = lerUsuarios();
    const usuario = usuarios.find(function (u) { return u.email === email; });

    if (!usuario) { msg.textContent = 'Nenhuma conta encontrada com este e-mail.'; return; }
    if (senha.length < 8) { msg.textContent = 'A nova senha precisa ter pelo menos 8 caracteres.'; return; }

    usuario.senha = senha;
    salvarUsuarios(usuarios);
    fecharModal(modal);
    document.getElementById('email').value = email;
    mostrarAviso('Senha alterada. Faça login com a nova senha.', 'sucesso');
  });
}

/* ---------- Cadastro ---------- */
function iniciarCadastro() {
  const form = document.getElementById('form-cadastro');
  const campoCNPJ = document.getElementById('cnpj');

  campoCNPJ.addEventListener('input', function () {
    campoCNPJ.value = mascararCNPJ(campoCNPJ.value);
  });

  form.addEventListener('submit', function (evento) {
    evento.preventDefault();

    const dados = {
      nome: document.getElementById('nome').value.trim(),
      negocio: document.getElementById('negocio').value.trim(),
      cnpj: campoCNPJ.value.trim(),
      ramo: document.getElementById('ramo').value.trim(),
      email: document.getElementById('email').value.trim().toLowerCase(),
      senha: document.getElementById('senha').value
    };
    const confirmacao = document.getElementById('confirmar').value;
    const usuarios = lerUsuarios();

    let ok = true;
    ok = marcarErro('nome', dados.nome.length < 3 ? 'Informe seu nome (mín. 3 letras).' : '') && ok;
    ok = marcarErro('negocio', dados.negocio.length < 2 ? 'Informe o nome do negócio.' : '') && ok;
    ok = marcarErro('cnpj', !validarCNPJ(dados.cnpj) ? 'CNPJ inválido. Confira os números.' : '') && ok;
    ok = marcarErro('ramo', dados.ramo.length < 3 ? 'Informe o ramo ou atividade.' : '') && ok;

    let erroEmail = '';
    if (!emailValido(dados.email)) erroEmail = 'Informe um e-mail válido.';
    else if (usuarios.some(function (u) { return u.email === dados.email; })) erroEmail = 'Este e-mail já está cadastrado.';
    ok = marcarErro('email', erroEmail) && ok;

    ok = marcarErro('senha', dados.senha.length < 8 ? 'A senha precisa ter pelo menos 8 caracteres.' : '') && ok;
    ok = marcarErro('confirmar', confirmacao !== dados.senha || !confirmacao ? 'As senhas não conferem.' : '') && ok;
    ok = marcarErro('termos', !document.getElementById('termos').checked ? 'É preciso aceitar os termos para continuar.' : '') && ok;
    if (!ok) {
      const primeiroErro = form.querySelector('.invalido input');
      if (primeiroErro) primeiroErro.focus();
      return;
    }

    // Plano escolhido na página inicial (cadastro.html?plano=...)
    const plano = new URLSearchParams(window.location.search).get('plano');
    dados.plano = ['Gratuito', 'Sem Anúncios', 'Com IA'].indexOf(plano) >= 0 ? plano : 'Gratuito';
    dados.id = gerarId();
    dados.criadoEm = hojeISO();

    usuarios.push(dados);
    salvarUsuarios(usuarios);
    entrar(dados.id);
    window.location.href = 'boas-vindas.html';
  });
}

document.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('form-login')) iniciarLogin();
  if (document.getElementById('form-cadastro')) iniciarCadastro();
});
