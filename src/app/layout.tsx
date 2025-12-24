import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { MainHeader } from '@/components/layout/main-header'

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
				</Providers>
			</body>
		</html>
	)
}
