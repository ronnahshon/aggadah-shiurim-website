import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
                // Biblical color palette
                parchment: {
                    light: '#F5F2E8', // Light parchment background
                    DEFAULT: '#EBE6D9', // Default parchment color
                    dark: '#D7CEBF', // Darker parchment for contrast
                },
                biblical: {
                    brown: '#3E2723', // Deep brown for text
                    burgundy: '#C8C8C9', // Kept as light grey (from previous change)
                    navy: '#D7CEB2', // Changed from light brown to a proper light brown
                    gold: '#C9B037', // Gold for accents
                    olive: '#556B2F', // Olive green
                    copper: '#B87333', // Bronze/copper accent
                }
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
                'fade-in': {
                    '0%': {
                        opacity: '0',
                        transform: 'translateY(10px)'
                    },
                    '100%': {
                        opacity: '1',
                        transform: 'translateY(0)'
                    }
                }
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
                'fade-in': 'fade-in 0.5s ease-out'
			},
            fontFamily: {
                'hebrew': ['David Libre', 'serif'],
            },
            boxShadow: {
                'scroll': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            },
            backgroundImage: {
                'parchment-texture': "url('/images/subtle-parchment.png')"
            },
            typography: {
                DEFAULT: {
                    css: {
                        color: '#3E2723',
                        a: {
                            color: '#C9B037',
                            '&:hover': {
                                color: '#B87333',
                            },
                        },
                        h1: {
                            color: '#3E2723',
                        },
                        h2: {
                            color: '#3E2723',
                        },
                        h3: {
                            color: '#3E2723',
                        },
                        h4: {
                            color: '#3E2723',
                        },
                        blockquote: {
                            color: '#556B2F',
                            borderLeftColor: '#D7CEBF',
                        },
                        code: {
                            color: '#3E2723',
                        },
                    },
                },
                'biblical': {
                    css: {
                        '--tw-prose-body': '#3E2723',
                        '--tw-prose-headings': '#3E2723',
                        '--tw-prose-lead': '#3E2723',
                        '--tw-prose-links': '#C9B037',
                        '--tw-prose-bold': '#3E2723',
                        '--tw-prose-counters': '#D7CEB2',
                        '--tw-prose-bullets': '#D7CEB2',
                        '--tw-prose-hr': '#D7CEBF',
                        '--tw-prose-quotes': '#556B2F',
                        '--tw-prose-quote-borders': '#D7CEBF',
                        '--tw-prose-captions': '#3E2723',
                        '--tw-prose-code': '#3E2723',
                        '--tw-prose-pre-code': '#F5F2E8',
                        '--tw-prose-pre-bg': '#3E2723',
                        '--tw-prose-th-borders': '#D7CEBF',
                        '--tw-prose-td-borders': '#D7CEBF',
                    },
                },
            }
		}
	},
	plugins: [require("tailwindcss-animate"), require('@tailwindcss/typography')],
} satisfies Config;
