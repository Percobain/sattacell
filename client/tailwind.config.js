/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ["class"],
	content: ["./index.html", "./src/**/*.{html,js,jsx}"],
	theme: {
		extend: {
			fontFamily: {
				mono: ['JetBrains Mono', 'monospace'],
				display: ['Orbitron', 'sans-serif'],
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			colors: {
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				},
				// Cyberpunk neon colors
				neon: {
					blue: 'hsl(187 100% 50%)',
					red: 'hsl(14 100% 50%)',
					purple: 'hsl(280 100% 60%)',
					green: 'hsl(120 100% 50%)',
					orange: 'hsl(30 100% 50%)',
				},
				cyber: {
					dark: 'hsl(240 20% 4%)',
					darker: 'hsl(240 20% 2%)',
					light: 'hsl(180 100% 95%)',
				}
			},
			boxShadow: {
				'neon-blue': '0 0 10px hsl(187 100% 50% / 0.5), 0 0 20px hsl(187 100% 50% / 0.3), 0 0 30px hsl(187 100% 50% / 0.2)',
				'neon-red': '0 0 10px hsl(14 100% 50% / 0.5), 0 0 20px hsl(14 100% 50% / 0.3), 0 0 30px hsl(14 100% 50% / 0.2)',
				'neon-purple': '0 0 10px hsl(280 100% 60% / 0.5), 0 0 20px hsl(280 100% 60% / 0.3), 0 0 30px hsl(280 100% 60% / 0.2)',
				'glow-sm': '0 0 5px hsl(187 100% 50% / 0.3)',
				'glow-md': '0 0 10px hsl(187 100% 50% / 0.4), 0 0 20px hsl(187 100% 50% / 0.2)',
				'glow-lg': '0 0 15px hsl(187 100% 50% / 0.5), 0 0 30px hsl(187 100% 50% / 0.3), 0 0 45px hsl(187 100% 50% / 0.1)',
			},
			animation: {
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
				'flicker': 'flicker 3s infinite',
				'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
				'float': 'float 3s ease-in-out infinite',
			},
			keyframes: {
				'pulse-glow': {
					'0%, 100%': { opacity: '1', filter: 'brightness(1)' },
					'50%': { opacity: '0.8', filter: 'brightness(1.2)' },
				},
				'flicker': {
					'0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100%': { opacity: '1' },
					'20%, 21.999%, 63%, 63.999%, 65%, 69.999%': { opacity: '0.4' },
				},
				'glow-pulse': {
					'0%, 100%': {
						boxShadow: '0 0 10px hsl(187 100% 50% / 0.3), 0 0 20px hsl(187 100% 50% / 0.2)'
					},
					'50%': {
						boxShadow: '0 0 20px hsl(187 100% 50% / 0.5), 0 0 40px hsl(187 100% 50% / 0.3), 0 0 60px hsl(187 100% 50% / 0.1)'
					},
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-5px)' },
				},
			},
		}
	},
	plugins: [require("tailwindcss-animate")],
}