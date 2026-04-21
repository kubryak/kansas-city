import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { MainHeader } from '@/components/layout/main-header'
import { Toaster } from 'react-hot-toast'

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
})

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
})

export const metadata: Metadata = {
	title: 'Kansas City Guild',
	description: 'Гильдийный дашборд Kansas City на сервере Sirus Neverest x3',
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang='ru'>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
			>
				<Providers>
					<div className='min-h-screen bg-[#050509] text-foreground'>
						<MainHeader />
						{children}
					</div>
					<Toaster 
				position="top-right"
				toastOptions={{
					duration: 4000,
					style: {
						background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
						border: '1px solid #334155',
						color: '#e5e7eb',
						fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
						boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
						backdropFilter: 'blur(8px)',
					},
					success: {
						iconTheme: {
							primary: '#22c55e',
							secondary: '#e5e7eb',
						},
					},
					error: {
						iconTheme: {
							primary: '#ef4444',
							secondary: '#e5e7eb',
						},
					},
				}}
			/>
				</Providers>
			</body>
		</html>
	)
}
