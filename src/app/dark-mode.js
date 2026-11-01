const themeButtons = document.querySelectorAll(".btn_theme");
const themeIcons = document.querySelectorAll(".theme_icon");
const copyIcon = document.getElementById("copy_icon");

themeButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const html = document.documentElement;
        const toDark = html.dataset.theme === "light";

        html.dataset.theme = toDark ? "dark" : "light";

        // Atualiza o ícone de todos os botões, para ficarem sincronizados
        // quando a tela (e o cabeçalho) mudar
        themeIcons.forEach((icon) => {
            icon.src = toDark
                ? "./img/light_mode_icon.svg"
                : "./img/dark_mode_icon.svg";
        });

        copyIcon.src = toDark
            ? "./img/copy_dark_mode.svg"
            : "./img/copy_light_mode.svg";
    });
});