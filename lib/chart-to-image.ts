/**
 * High-Quality Chart to Image Converter
 * Uses Recharts to generate SVG charts at high resolution
 * Converts to base64 for embedding in reports
 */

import { renderToString } from 'react-dom/server'
import { createElement } from 'react'

/**
 * Converts a React chart component to a high-quality base64 image
 * @param ChartComponent - The Recharts component to render
 * @param width - Width in pixels (default: 1200 for high quality)
 * @param height - Height in pixels (default: 600 for high quality)
 * @returns Promise<string> - Base64 encoded SVG data URL
 */
export async function chartToBase64Image(
  ChartComponent: React.ReactElement,
  width: number = 1200,
  height: number = 600
): Promise<string> {
  try {
    // Render the React component to SVG string
    const svgString = renderToString(ChartComponent)
    
    // Create a proper SVG with viewBox for scaling
    const fullSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        ${svgString}
      </svg>
    `
    
    // Convert to base64
    const base64 = Buffer.from(fullSvg).toString('base64')
    return `data:image/svg+xml;base64,${base64}`
  } catch (error) {
    console.error('Error converting chart to image:', error)
    return ''
  }
}

/**
 * Captures chart by rendering hidden Recharts component to SVG
 * This works in the browser without needing server-side rendering
 */
export function captureChartAsSVG(containerId: string): string {
  try {
    const container = document.getElementById(containerId)
    if (!container) {
      console.warn(`Container ${containerId} not found`)
      return ''
    }

    // Find the SVG element inside the container
    const svgElement = container.querySelector('svg')
    if (!svgElement) {
      console.warn(`No SVG found in container ${containerId}`)
      return ''
    }

    // Clone the SVG to avoid modifying the original
    const clonedSvg = svgElement.cloneNode(true) as SVGElement
    
    // Get current dimensions or use defaults
    const width = svgElement.clientWidth || 1200
    const height = svgElement.clientHeight || 600
    
    // Set explicit dimensions and viewBox for proper scaling
    clonedSvg.setAttribute('width', width.toString())
    clonedSvg.setAttribute('height', height.toString())
    clonedSvg.setAttribute('viewBox', `0 0 ${width} ${height}`)
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    
    // Get all computed styles and inline them (important for correct rendering)
    const allElements = clonedSvg.querySelectorAll('*')
    allElements.forEach((element) => {
      const computedStyle = window.getComputedStyle(element as Element)
      let styleString = ''
      for (let i = 0; i < computedStyle.length; i++) {
        const property = computedStyle[i]
        const value = computedStyle.getPropertyValue(property)
        styleString += `${property}:${value};`
      }
      ;(element as HTMLElement).setAttribute('style', styleString)
    })
    
    // Serialize the SVG to string
    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(clonedSvg)
    
    // Convert to base64
    const base64 = btoa(unescape(encodeURIComponent(svgString)))
    return `data:image/svg+xml;base64,${base64}`
  } catch (error) {
    console.error('Error capturing chart as SVG:', error)
    return ''
  }
}

/**
 * Captures all charts in hidden containers and returns them as base64 SVG images
 * @param chartIds - Array of container IDs to capture
 * @returns Promise<Record<string, string>> - Map of chart IDs to base64 images
 */
export async function captureAllCharts(chartIds: string[]): Promise<Record<string, string>> {
  const chartImages: Record<string, string> = {}
  
  // Wait a bit for charts to fully render
  await new Promise(resolve => setTimeout(resolve, 500))
  
  for (const chartId of chartIds) {
    const image = captureChartAsSVG(chartId)
    if (image) {
      chartImages[chartId] = image
    }
  }
  
  return chartImages
}

