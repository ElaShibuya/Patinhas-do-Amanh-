document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  const successMessage = document.getElementById('contact-success');
  const newMessageBtn = document.getElementById('new-mensage-button');

  // Ao enviar o formulário
  form.addEventListener('submit', (e) => {
    e.preventDefault(); // Impede o recarregamento da página

    // Esconde o formulário
    form.hidden = true;

    // Exibe a mensagem de sucesso e o novo botão
    successMessage.hidden = false;
    newMessageBtn.hidden = false;
  });

  // Ao clicar em "Mandar nova mensagem"
  newMessageBtn.addEventListener('click', () => {
    // Reseta os campos do formulário
    form.reset();

    // Reexibe o formulário
    form.hidden = false;

    // Esconde a mensagem de sucesso e o botão
    successMessage.hidden = true;
    newMessageBtn.hidden = true;
  });
});