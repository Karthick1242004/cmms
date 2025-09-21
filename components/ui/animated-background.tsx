"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

interface Particle {
  id: number
  x: number
  y: number
  size: number
  duration: number
  delay: number
}

interface FloatingShape {
  id: number
  x: number
  y: number
  size: number
  rotation: number
  duration: number
  delay: number
  shape: 'circle' | 'square' | 'triangle'
}

export function AnimatedBackground() {
  const [particles, setParticles] = useState<Particle[]>([])
  const [shapes, setShapes] = useState<FloatingShape[]>([])

  useEffect(() => {
    // Generate random particles
    const newParticles: Particle[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 5,
    }))

    // Generate floating shapes
    const newShapes: FloatingShape[] = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 120 + 60,
      rotation: Math.random() * 360,
      duration: Math.random() * 25 + 20,
      delay: Math.random() * 8,
      shape: ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)] as 'circle' | 'square' | 'triangle',
    }))

    setParticles(newParticles)
    setShapes(newShapes)
  }, [])

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Your Beautiful Gradient Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/orange-and-blue-colored-mesh-gradient-messy-color-mix-artwork-vector.jpg')`,
        }}
      />
      
      {/* Enhanced overlay for glass effect compatibility */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-200/20 via-blue-200/20 to-purple-200/20 dark:from-orange-900/30 dark:via-blue-900/30 dark:to-purple-900/30" />
      
      {/* Animated gradient overlay for depth */}
      <motion.div
        className="absolute inset-0 opacity-20"
        animate={{
          background: [
            "radial-gradient(circle at 20% 50%, rgba(255, 165, 0, 0.2) 0%, transparent 50%)",
            "radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.2) 0%, transparent 50%)",
            "radial-gradient(circle at 40% 80%, rgba(168, 85, 247, 0.2) 0%, transparent 50%)",
            "radial-gradient(circle at 20% 50%, rgba(255, 165, 0, 0.2) 0%, transparent 50%)",
          ],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Enhanced mesh gradient overlay matching your background */}
      <div className="absolute inset-0 opacity-15">
        <div 
          className="w-full h-full"
          style={{
            background: `
              radial-gradient(circle at 25% 25%, rgba(255, 165, 0, 0.3) 0%, transparent 25%),
              radial-gradient(circle at 75% 25%, rgba(59, 130, 246, 0.3) 0%, transparent 25%),
              radial-gradient(circle at 25% 75%, rgba(147, 51, 234, 0.3) 0%, transparent 25%),
              radial-gradient(circle at 75% 75%, rgba(236, 72, 153, 0.3) 0%, transparent 25%)
            `
          }}
        />
      </div>

      {/* Floating particles with orange/blue theme */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-gradient-to-r from-orange-300/30 to-blue-300/30 dark:from-orange-400/20 dark:to-blue-400/20"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Large floating shapes */}
      {shapes.map((shape) => (
        <motion.div
          key={shape.id}
          className="absolute"
          style={{
            left: `${shape.x}%`,
            top: `${shape.y}%`,
            width: `${shape.size}px`,
            height: `${shape.size}px`,
          }}
          animate={{
            y: [0, -40, 0],
            x: [0, 20, 0],
            rotate: [shape.rotation, shape.rotation + 180, shape.rotation + 360],
            opacity: [0.05, 0.15, 0.05],
          }}
          transition={{
            duration: shape.duration,
            delay: shape.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {shape.shape === 'circle' && (
            <div className="w-full h-full rounded-full bg-gradient-to-r from-orange-400/25 to-blue-400/25 dark:from-orange-500/15 dark:to-blue-500/15 blur-lg" />
          )}
          {shape.shape === 'square' && (
            <div className="w-full h-full rounded-lg bg-gradient-to-r from-blue-400/25 to-purple-400/25 dark:from-blue-500/15 dark:to-purple-500/15 blur-lg transform rotate-45" />
          )}
          {shape.shape === 'triangle' && (
            <div 
              className="w-full h-full bg-gradient-to-r from-orange-400/25 to-pink-400/25 dark:from-orange-500/15 dark:to-pink-500/15 blur-lg"
              style={{
                clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
              }}
            />
          )}
        </motion.div>
      ))}

      {/* Subtle noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  )
}

