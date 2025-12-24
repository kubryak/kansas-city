'use client'

import { useState } from 'react'

interface SafeImageProps {
	src: string
	alt: string
	className?: string
	onError?: () => void
}

export function SafeImage ({ src, alt, className, onError }: SafeImageProps) {
	const [imageError, setImageError] = useState(false)
	const [isLoading, setIsLoading] = useState(true)

	const handleError = () => {
		setImageError(true)
		setIsLoading(false)
		if (onError) {
			onError()
		}
	}

	const handleLoad = () => {
		setIsLoading(false)
	}

	if (imageError) {
		return (
			<div
				className={`flex items-center justify-center bg-zinc-800 ${className || ''}`}
			>
				<span className='text-xs text-zinc-500'>?</span>
			</div>
		)
	}

	return (
		<div className={`relative overflow-hidden ${className || ''}`}>
			{isLoading && (
				<div className='absolute inset-0 flex items-center justify-center bg-zinc-800 animate-pulse z-10'>
					<div className='h-2 w-2 rounded-full bg-zinc-600' />
				</div>
			)}
			<img
				src={src}
				alt={alt}
				className={`block h-full w-full object-cover ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
				onError={handleError}
				onLoad={handleLoad}
				loading='lazy'
				decoding='async'
			/>
		</div>
	)
}




