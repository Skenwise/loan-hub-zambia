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
                // Primary: Soft off-white background (less bright, more professional)
                primary: "#F8F9FA",
                "primary-foreground": "#2D3748",
                
                // Secondary: Professional Blue (less saturated than before)
                secondary: "#0B5394",
                "secondary-foreground": "#FFFFFF",
                
                // Deep Blue - for high visibility text and buttons (muted)
                "deep-blue": "#1A3A52",
                "deep-blue-light": "#2D5A7B",
                
                // Very Deep Dark Blue - for panels and sidebars (softer)
                "panel-dark": "#1F2937",
                "panel-dark-light": "#374151",
                "panel-text": "#F3F4F6",
                "panel-text-secondary": "#D1D5DB",
                
                // Background and Card colors (softer)
                background: "#F8F9FA",
                cardbackground: "#FFFFFF",
                
                // Text and Foreground colors (softer, less harsh)
                foreground: "#2D3748",
                textprimary: "#2D3748",
                darktext: "#2D3748",
                
                // Accent colors (muted)
                brandaccent: "#0B5394",
                buttonbackground: "#0B5394",
                buttonforeground: "#FFFFFF",
                buttonoutline: "#0B5394",
                buttonborder: "#0B5394",
                
                // Input styling (softer)
                inputbackground: "#FFFFFF",
                inputborder: "#D1D5DB",
                
                // Content blocks and panels (subtle grey)
                contentblockbackground: "#F3F4F6",
                "contentblockbackground-custom": "#F3F4F6",
                
                // Icon and UI elements (neutral grey)
                iconcolor: "#6B7280",
                
                // Status colors
                destructive: "#DC2626",
                destructiveforeground: "#FFFFFF",
                
                // Success (green for success states)
                success: "#059669",
                "success-foreground": "#FFFFFF",
                
                // Warning (amber for demo mode)
                warning: "#D97706",
                "warning-foreground": "#FFFFFF",
                
                // Info/Highlight (soft blue)
                info: "#2563EB",
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
