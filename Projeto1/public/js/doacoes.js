const donationForm = document.getElementById("donation-form");
const codeInput = document.getElementById("donor-code");
const codeError = document.getElementById("code-error");
const successBox = document.getElementById("donation-success");
const newDonationButton = document.getElementById("new-donation-button");

donationForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const code = codeInput.value.trim();

  if (!/^\d{6}$/.test(code)) {
    codeError.hidden = false;
    codeInput.focus();
    return;
  }

  codeError.hidden = true;

  const formData = new FormData(donationForm);
  const data = new URLSearchParams(formData);

  try {
    const response = await fetch("/pagto", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: data.toString()
    });

    if (!response.ok) {
      const message = await response.text();
      alert(message || "Não foi possível registrar a doação.");
      return;
    }

    // Continua na mesma página: esconde o formulário e mostra somente
    // a mensagem de agradecimento e o botão para uma nova doação.
    donationForm.hidden = true;
    successBox.hidden = false;
  } catch (error) {
    alert("Não foi possível registrar a doação. Verifique se o servidor está em execução.");
  }
});

newDonationButton.addEventListener("click", function () {
  donationForm.reset();
  codeError.hidden = true;
  successBox.hidden = true;
  donationForm.hidden = false;
  codeInput.focus();
});
