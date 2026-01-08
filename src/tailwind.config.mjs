/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}', './public/**/*.html'],
    theme: {
        extend: {
            fontSize: {
                xs: ["0.75rem", { lineHeight: "1.25", letterSpacing: "0.02em", fontWeight: "400" }],
                sm: ["0.875rem", { lineHeight: "1.35", letterSpacing: "0.015em", fontWeight: "400" }],
                base: ["1rem", { lineHeight: "1.5", letterSpacing: "0.01em", fontWeight: "400" }],
                lg: ["1.125rem", { lineHeight: "1.5", letterSpacing: "0.005em", fontWeight: "400" }],
                xl: ["1.25rem", { lineHeight: "1.5", letterSpacing: "0em", fontWeight: "600" }],
                "2xl": ["1.5rem", { lineHeight: "1.4", letterSpacing: "-0.005em", fontWeight: "600" }],
                "3xl": ["1.875rem", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "700" }],
                "4xl": ["2.25rem", { lineHeight: "1.2", letterSpacing: "-0.015em", fontWeight: "700" }],
                "5xl": ["3rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
                "6xl": ["3.75rem", { lineHeight: "1.1", letterSpacing: "-0.025em", fontWeight: "700" }],
                "7xl": ["4.5rem", { lineHeight: "1", letterSpacing: "-0.03em", fontWeight: "700" }],
                "8xl": ["6rem", { lineHeight: "1", letterSpacing: "-0.035em", fontWeight: "700" }],
                "9xl": ["8rem", { lineHeight: "1", letterSpacing: "-0.04em", fontWeight: "700" }],
            },
            fontFamily: {
                heading: ["poppins-v2"],
                paragraph: ["open sans"]
            },
            colors: {
                primary: "#000000",
                "primary-foreground": "#FFFFFF",
                secondary: "#5C2EE2",
                "secondary-foreground": "#FFFFFF",
                background: "#FFFFFF",
                brandaccent: "#5C2EE2",
                buttonbackground: "#5C2EE2",
                foreground: "#FFFFFF",
                destructive: "#DF3131",
                destructiveforeground: "#FFFFFF",
                iconcolor: "#5C2EE2",
                contentblockbackground: "#F5F5F7",
                buttonoutline: "#E0E0E0",
                cardbackground: "#F5F5F7",
                textprimary: "#000000",
                inputbackground: "#FFFFFF",
                inputborder: "#E0E0E0",
                buttonforeground: "#FFFFFF",
                darktext: "#000000",
                buttonborder: "#E0E0E0",
                "contentblockbackground-custom": "#F5F5F7",
                "secondary-foreground-new": "#FFFFFF",
                "secondary-foreground-old": "#FFFFFF",
                "secondary-foreground-token": "#000000"
            },
        },
    },
    future: {
        hoverOnlyWhenSupported: true,
    },
    plugins: [require('@tailwindcss/container-queries'), require('@tailwindcss/typography')],
}
