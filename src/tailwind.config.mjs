/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}', './public/**/*.html'],
    theme: {
        extend: {
            fontSize: {
                xs: ["0.75rem", { lineHeight: "1.25", letterSpacing: "0.02em", fontWeight: "400" }],
                sm: ["0.875rem", { lineHeight: "1.35", letterSpacing: "0.02em", fontWeight: "400" }],
                base: ["1rem", { lineHeight: "1.5", letterSpacing: "0.025em", fontWeight: "400" }],
                lg: ["1.125rem", { lineHeight: "1.5", letterSpacing: "0.025em", fontWeight: "400" }],
                xl: ["1.25rem", { lineHeight: "1.5", letterSpacing: "0.02em", fontWeight: "600" }],
                "2xl": ["1.5rem", { lineHeight: "1.4", letterSpacing: "0.015em", fontWeight: "600" }],
                "3xl": ["1.875rem", { lineHeight: "1.3", letterSpacing: "0em", fontWeight: "700" }],
                "4xl": ["2.25rem", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "700" }],
                "5xl": ["3rem", { lineHeight: "1.1", letterSpacing: "-0.015em", fontWeight: "700" }],
                "6xl": ["3.75rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "800" }],
                "7xl": ["4.5rem", { lineHeight: "1.05", letterSpacing: "-0.025em", fontWeight: "800" }],
                "8xl": ["6rem", { lineHeight: "1", letterSpacing: "-0.03em", fontWeight: "900" }],
                "9xl": ["8rem", { lineHeight: "1", letterSpacing: "-0.035em", fontWeight: "900" }],
            },
            fontFamily: {
                heading: ["bitter"],
                paragraph: ["madefor-display"]
            },
            colors: {
                primary: "#FFFFFF",
                "primary-foreground": "#333333",
                secondary: "#B9D6E8",
                "secondary-foreground": "#333333",
                background: "#FFFFFF",
                brandaccent: "#B9D6E8",
                buttonbackground: "#B9D6E8",
                foreground: "#333333ff",
                destructive: "#DF3131",
                destructiveforeground: "#FFFFFF",
                iconcolor: "#B9D6E8",
                contentblockbackground: "#E6F0F6",
                buttonoutline: "#333333",
                cardbackground: "#E6F0F6",
                textprimary: "#333333",
                inputbackground: "#FFFFFF",
                inputborder: "#333333",
                buttonforeground: "#333333",
                darktext: "#333333",
                buttonborder: "#333333",
                "contentblockbackground-custom": "#E6F0F6",
                "secondary-foreground-new": "#333333",
                "secondary-foreground-old": "#333333"
            },
        },
    },
    future: {
        hoverOnlyWhenSupported: true,
    },
    plugins: [require('@tailwindcss/container-queries'), require('@tailwindcss/typography')],
}
