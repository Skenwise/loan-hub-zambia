/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}', './public/**/*.html'],
    theme: {
        extend: {
            fontSize: {
                xs: ["0.75rem", { lineHeight: "1.25", letterSpacing: "0.02em", fontWeight: "400" }],
                sm: ["0.875rem", { lineHeight: "1.35", letterSpacing: "0.02em", fontWeight: "400" }],
                base: ["1rem", { lineHeight: "1.5", letterSpacing: "0.025em", fontWeight: "400" }],
                lg: ["1.125rem", { lineHeight: "1.5", letterSpacing: "0.025em", fontWeight: "500" }],
                xl: ["1.25rem", { lineHeight: "1.5", letterSpacing: "0.03em", fontWeight: "600" }],
                "2xl": ["1.5rem", { lineHeight: "1.4", letterSpacing: "0.03em", fontWeight: "600" }],
                "3xl": ["1.875rem", { lineHeight: "1.3", letterSpacing: "0.03em", fontWeight: "700" }],
                "4xl": ["2.25rem", { lineHeight: "1.2", letterSpacing: "0.035em", fontWeight: "700" }],
                "5xl": ["3rem", { lineHeight: "1.1", letterSpacing: "0.04em", fontWeight: "800" }],
                "6xl": ["3.75rem", { lineHeight: "1.1", letterSpacing: "0.04em", fontWeight: "800" }],
                "7xl": ["4.5rem", { lineHeight: "1", letterSpacing: "0.045em", fontWeight: "900" }],
                "8xl": ["6rem", { lineHeight: "1", letterSpacing: "0.05em", fontWeight: "900" }],
                "9xl": ["8rem", { lineHeight: "1", letterSpacing: "0.05em", fontWeight: "900" }],
            },
            fontFamily: {
                heading: ["syne"],
                paragraph: ["barlow-extralight"]
            },
            colors: {
                // Primary: White background (clean, professional)
                primary: "#FFFFFF",
                "primary-foreground": "#1F2937",
                
                // Secondary: Deep Professional Blue (LinkedIn-style) - now used for accents
                secondary: "#0A66C2",
                "secondary-foreground": "#FFFFFF",
                
                // Deep Blue - for high visibility text and buttons
                "deep-blue": "#003D7A",
                "deep-blue-light": "#0052A3",
                
                // Very Deep Dark Blue - for panels and sidebars
                "panel-dark": "#0F1B2E",
                "panel-dark-light": "#1A2847",
                "panel-text": "#FFFFFF",
                "panel-text-secondary": "#E0E7FF",
                
                // Background and Card colors
                background: "#FFFFFF",
                cardbackground: "#FFFFFF",
                
                // Text and Foreground colors
                foreground: "#1F2937",
                textprimary: "#1F2937",
                darktext: "#1F2937",
                
                // Accent colors
                brandaccent: "#0A66C2",
                buttonbackground: "#0A66C2",
                buttonforeground: "#FFFFFF",
                buttonoutline: "#0A66C2",
                buttonborder: "#0A66C2",
                
                // Input styling
                inputbackground: "#FFFFFF",
                inputborder: "#E5E7EB",
                
                // Content blocks and panels (light grey for subtle contrast)
                contentblockbackground: "#F9FAFB",
                "contentblockbackground-custom": "#F9FAFB",
                
                // Icon and UI elements (neutral grey)
                iconcolor: "#6B7280",
                
                // Status colors
                destructive: "#DC2626",
                destructiveforeground: "#FFFFFF",
                
                // Success (green for success states)
                success: "#10B981",
                "success-foreground": "#FFFFFF",
                
                // Warning (amber for demo mode)
                warning: "#F59E0B",
                "warning-foreground": "#FFFFFF",
                
                // Info/Highlight (soft blue)
                info: "#3B82F6",
                "info-foreground": "#FFFFFF",
                
                // Secondary foreground variants (light blue tints)
                "secondary-foreground-new": "#EFF6FF",
                "secondary-foreground-old": "#EFF6FF",
                "secondary-foreground-token": "#EFF6FF"
            },
        },
    },
    future: {
        hoverOnlyWhenSupported: true,
    },
    plugins: [require('@tailwindcss/container-queries'), require('@tailwindcss/typography')],
}
