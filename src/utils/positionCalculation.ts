import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface Position {
  x: number;
  y: number;
}

export interface TextItemBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FloatingTextData {
  key: string;
  label: string;
  value: string;
  preferredPosition?: Position;
}

// Calculate text bounds based on content
export function calculateTextBounds(
  text: string,
  position: Position,
  fontSize = 14,
): TextItemBounds {
  // Rough estimation of text dimensions
  const charWidth = fontSize * 0.6; // Approximate character width
  const lineHeight = fontSize * 1.4; // Line height with spacing

  const maxLineLength = Math.max(
    text.split('\n').reduce((max, line) => Math.max(max, line.length), 0),
    8, // Minimum width
  );

  const lines = text.split('\n').length;

  const width = Math.min(maxLineLength * charWidth + 24, 200); // Add padding, max width
  const height = lines * lineHeight + 16; // Add padding

  return {
    x: position.x,
    y: position.y,
    width,
    height,
  };
}

// Check if two rectangles overlap
export function doRectanglesOverlap(
  rect1: TextItemBounds,
  rect2: TextItemBounds,
): boolean {
  const buffer = 10; // Minimum spacing between items

  return !(
    rect1.x + rect1.width + buffer < rect2.x ||
    rect2.x + rect2.width + buffer < rect1.x ||
    rect1.y + rect1.height + buffer < rect2.y ||
    rect2.y + rect2.height + buffer < rect1.y
  );
}

// Generate default positions for floating text items
export function generateDefaultPositions(itemCount: number): Position[] {
  const positions: Position[] = [];
  const padding = 40;
  const availableWidth = screenWidth - padding * 2;
  const availableHeight = screenHeight - padding * 2;

  // Create a grid-like distribution
  const cols = Math.ceil(Math.sqrt(itemCount));
  const rows = Math.ceil(itemCount / cols);

  const cellWidth = availableWidth / cols;
  const cellHeight = availableHeight / rows;

  for (let i = 0; i < itemCount; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;

    // Add some randomness to avoid perfect grid
    const randomOffsetX = (Math.random() - 0.5) * cellWidth * 0.3;
    const randomOffsetY = (Math.random() - 0.5) * cellHeight * 0.3;

    const x = padding + col * cellWidth + cellWidth * 0.25 + randomOffsetX;
    const y = padding + row * cellHeight + cellHeight * 0.25 + randomOffsetY;

    positions.push({
      x: Math.max(padding, Math.min(x, screenWidth - padding - 150)),
      y: Math.max(padding, Math.min(y, screenHeight - padding - 60)),
    });
  }

  return positions;
}

// Resolve overlapping positions using a simple algorithm
export function resolveOverlappingPositions(
  textItems: FloatingTextData[],
  preferredPositions?: Position[],
): Position[] {
  const positions: Position[] = [];
  const bounds: TextItemBounds[] = [];

  // Use preferred positions or generate defaults
  const initialPositions =
    preferredPositions || generateDefaultPositions(textItems.length);

  for (let i = 0; i < textItems.length; i++) {
    const item = textItems[i];
    let position = initialPositions[i] || { x: 50, y: 50 + i * 80 };

    // Calculate bounds for this item
    const itemBounds = calculateTextBounds(
      `${item?.label || ''}\n${item?.value || ''}`,
      position,
    );

    // Check for overlaps with existing items
    let attempts = 0;
    const maxAttempts = 20;

    while (attempts < maxAttempts) {
      let hasOverlap = false;

      for (const existingBounds of bounds) {
        if (doRectanglesOverlap(itemBounds, existingBounds)) {
          hasOverlap = true;
          break;
        }
      }

      if (!hasOverlap) {
        break;
      }

      // Try to find a new position
      const angle = (attempts / maxAttempts) * Math.PI * 2;
      const distance = 50 + attempts * 10;
      const basePosition = initialPositions[i] || { x: 50, y: 50 };

      position = {
        x: Math.max(
          20,
          Math.min(
            basePosition.x + Math.cos(angle) * distance,
            screenWidth - 170,
          ),
        ),
        y: Math.max(
          20,
          Math.min(
            basePosition.y + Math.sin(angle) * distance,
            screenHeight - 80,
          ),
        ),
      };

      // Recalculate bounds with new position
      itemBounds.x = position.x;
      itemBounds.y = position.y;

      attempts++;
    }

    positions.push(position);
    bounds.push(itemBounds);
  }

  return positions;
}

// Calculate positions based on image analysis (for future enhancement)
export function calculateImageBasedPositions(
  textItems: FloatingTextData[],
  _imageWidth: number,
  _imageHeight: number,
  _displayWidth: number,
  _displayHeight: number,
): Position[] {
  // For now, use default positions
  // In the future, this could analyze the image to find optimal placement
  return generateDefaultPositions(textItems.length);
}

// Ensure position is within screen bounds
export function clampPositionToScreen(
  position: Position,
  itemWidth = 150,
  itemHeight = 60,
): Position {
  const padding = 20;

  return {
    x: Math.max(
      padding,
      Math.min(position.x, screenWidth - itemWidth - padding),
    ),
    y: Math.max(
      padding,
      Math.min(position.y, screenHeight - itemHeight - padding),
    ),
  };
}
