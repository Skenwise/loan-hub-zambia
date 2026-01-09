/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}', './public/**/*.html'],
    theme: {
        extend: {
            fontSize: {
                xs: ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.01em", fontWeight: "500" }],
                sm: ["0.875rem", { lineHeight: "1.5", letterSpacing: "0.01em", fontWeight: "500" }],
                base: ["1rem", { lineHeight: "1.6", letterSpacing: "0.01em", fontWeight: "500" }],
                lg: ["1.125rem", { lineHeight: "1.6", letterSpacing: "0.01em", fontWeight: "600" }],
                xl: ["1.25rem", { lineHeight: "1.6", letterSpacing: "0.01em", fontWeight: "600" }],
                "2xl": ["1.5rem", { lineHeight: "1.5", letterSpacing: "0.01em", fontWeight: "700" }],
                "3xl": ["1.875rem", { lineHeight: "1.4", letterSpacing: "0.01em", fontWeight: "700" }],
                "4xl": ["2.25rem", { lineHeight: "1.3", letterSpacing: "0.01em", fontWeight: "700" }],
                "5xl": ["3rem", { lineHeight: "1.2", letterSpacing: "0em", fontWeight: "800" }],
                "6xl": ["3.75rem", { lineHeight: "1.1", letterSpacing: "0em", fontWeight: "800" }],
                "7xl": ["4.5rem", { lineHeight: "1", letterSpacing: "-0.01em", fontWeight: "900" }],
                "8xl": ["6rem", { lineHeight: "1", letterSpacing: "-0.01em", fontWeight: "900" }],
                "9xl": ["8rem", { lineHeight: "1", letterSpacing: "-0.02em", fontWeight: "900" }],
            },
            fontFamily: {
                heading: ["syne"],
                paragraph: ["barlow"]
            },
            colors: {
                primary: "#0F172A",
                "primary-foreground": "#FFFFFF",
                
                secondary: "#3567fd",
                "secondary-foreground": "#FFFFFF",
                
                "deep-blue": "#1E293B",
                "deep-blue-light": "#3567fd",
                
                "panel-dark": "#1E293B",
                "panel-dark-light": "#3567fd",
                "panel-text": "#E8EBF5",
                "panel-text-secondary": "#A8B5C8",
                
                background: "#0F172A",
                cardbackground: "#0F172A",
                
                foreground: "#E8EBF5",
                textprimary: "#E8EBF5",
                darktext: "#E8EBF5",
                
                brandaccent: "#3567fd",
                buttonbackground: "#1E293B",
                buttonforeground: "#FFFFFF",
                buttonoutline: "#3567fd",
                buttonborder: "#1E293B",
                
                inputbackground: "#1E293B",
                inputborder: "#A8B5C8",
                
                contentblockbackground: "#CBD5E1",
                "contentblockbackground-custom": "#CBD5E1",
                
                iconcolor: "#A8B5C8",
                
                destructive: "#DF3131",
                destructiveforeground: "#ffffff",
                
                success: "#3567fd",
                "success-foreground": "#FFFFFF",
                
                warning: "#3567fd",
                "warning-foreground": "#FFFFFF",
                
                info: "#3567fd",
                "info-foreground": "#FFFFFF",
                
                "secondary-foreground-new": "#E8EBF5",
                "secondary-foreground-old": "#E8EBF5",
                "secondary-foreground-token": "#E8EBF5"
            },
        },
    },
    future: {
        hoverOnlyWhenSupported: true,
    },
    plugins: [require('@tailwindcss/container-queries'), require('@tailwindcss/typography')],
}
