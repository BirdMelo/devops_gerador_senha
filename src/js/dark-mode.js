const themeButton = document.getElementById("btn_theme");
const themeIcon = document.getElementById("theme_icon");
const copyIcon = document.getElementById("copy_icon");

themeButton.addEventListener("click", () => {
    const html = document.documentElement;

    if (html.dataset.theme === "light") {
        html.dataset.theme = "dark";

        themeIcon.src = "./img/light_mode_icon.svg";
        copyIcon.src = "./img/copy_dark_mode.svg";
    } else {
        html.dataset.theme = "light";

        themeIcon.src = "./img/dark_mode_icon.svg";
        copyIcon.src = "./img/copy_light_mode.svg";
    }
});