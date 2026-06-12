module.exports = {
  style: {
    postcss: {
      plugins: (plugins) => [
        require("tailwindcss")("./tailwind.config.js"),
        require("autoprefixer"),
        ...plugins,
      ],
    },
  },
};
