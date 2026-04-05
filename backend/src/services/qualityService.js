const sharp = require('sharp');

async function detectText(buffer) {
  try {
    const tesseract = require('tesseract.js');
    if (typeof tesseract.recognize === 'function') {
      const result = await tesseract.recognize(buffer, 'eng');
      return (result?.data?.text || '').trim();
    }

    if (typeof tesseract.createWorker === 'function') {
      const worker = await tesseract.createWorker('eng');
      const result = await worker.recognize(buffer);
      await worker.terminate();
      return (result?.data?.text || '').trim();
    }

    return '';
  } catch (error) {
    return '';
  }
}

function average(values) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateSharpness(pixels, width, height) {
  let totalDiff = 0;
  let sampleCount = 0;

  for (let y = 1; y < height; y += 1) {
    for (let x = 1; x < width; x += 1) {
      const index = y * width + x;
      const current = pixels[index];
      const left = pixels[index - 1];
      const up = pixels[index - width];
      totalDiff += Math.abs(current - left) + Math.abs(current - up);
      sampleCount += 2;
    }
  }

  return sampleCount === 0 ? 0 : totalDiff / sampleCount;
}

function calculateCornerContrast(pixels, width, height) {
  const cornerWidth = Math.max(4, Math.floor(width * 0.2));
  const cornerHeight = Math.max(4, Math.floor(height * 0.2));
  const centerStartX = Math.floor(width * 0.35);
  const centerEndX = Math.floor(width * 0.65);
  const centerStartY = Math.floor(height * 0.35);
  const centerEndY = Math.floor(height * 0.65);

  const cornerValues = [];
  const centerValues = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const value = pixels[y * width + x];
      const isCorner = (x < cornerWidth && y < cornerHeight) ||
        (x >= width - cornerWidth && y < cornerHeight) ||
        (x < cornerWidth && y >= height - cornerHeight) ||
        (x >= width - cornerWidth && y >= height - cornerHeight);
      const isCenter = x >= centerStartX && x <= centerEndX && y >= centerStartY && y <= centerEndY;

      if (isCorner) cornerValues.push(value);
      if (isCenter) centerValues.push(value);
    }
  }

  const cornerMean = average(cornerValues);
  const centerMean = average(centerValues);
  const diff = Math.abs(cornerMean - centerMean);
  return Math.min(1, diff / 55);
}

function calculateSaturation(buffer, channels) {
  let saturationSum = 0;
  for (let i = 0; i < buffer.length; i += channels) {
    const r = buffer[i];
    const g = buffer[i + 1];
    const b = buffer[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    saturationSum += saturation;
  }

  return saturationSum / (buffer.length / channels || 1);
}

function calculateEdgeVariance(pixels) {
  let sum = 0;
  let sumSquares = 0;

  for (const pixel of pixels) {
    sum += pixel;
    sumSquares += pixel * pixel;
  }

  const count = pixels.length || 1;
  const mean = sum / count;
  return sumSquares / count - mean * mean;
}

function calculateCornerDensity(pixels, width, height) {
  const cornerWidth = Math.max(8, Math.floor(width * 0.18));
  const cornerHeight = Math.max(8, Math.floor(height * 0.18));
  let cornerPixels = 0;
  let totalPixels = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const isCorner = (x < cornerWidth && y < cornerHeight) ||
        (x >= width - cornerWidth && y < cornerHeight) ||
        (x < cornerWidth && y >= height - cornerHeight) ||
        (x >= width - cornerWidth && y >= height - cornerHeight);

      if (isCorner) {
        if (pixels[y * width + x] < 245) {
          cornerPixels += 1;
        }
        totalPixels += 1;
      }
    }
  }

  return cornerPixels / (totalPixels || 1);
}

async function inspectImage(buffer) {
  const strictValidation = String(process.env.STRICT_IMAGE_VALIDATION || 'false').toLowerCase() === 'true';
  const sharpImage = sharp(buffer).rotate();
  const metadata = await sharpImage.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error('Unable to read image metadata.');
  }

  const resized = await sharpImage
    .resize(96, 96, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = resized;
  const grayscale = await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: info.channels,
    },
  })
    .greyscale()
    .raw()
    .toBuffer();

  let red = 0;
  let green = 0;
  let blue = 0;
  let pixelCount = 0;

  for (let i = 0; i < data.length; i += info.channels) {
    red += data[i];
    green += data[i + 1];
    blue += data[i + 2];
    pixelCount += 1;
  }

  const averageRed = red / (pixelCount || 1);
  const averageGreen = green / (pixelCount || 1);
  const averageBlue = blue / (pixelCount || 1);
  const brightness = (averageRed + averageGreen + averageBlue) / 3;
  const saturation = calculateSaturation(data, info.channels);
  const blueBias = (averageBlue - averageRed) / 255;
  const contrast = calculateSharpness(grayscale, info.width, info.height);
  const watermarkScore = calculateCornerContrast(grayscale, info.width, info.height);
  const blurScore = contrast;
  const edgeVariance = calculateEdgeVariance(Array.from(grayscale));
  const cornerDensity = calculateCornerDensity(grayscale, info.width, info.height);
  const textContent = await detectText(buffer);
  const hasText = textContent.length > 0;
  const looksDistorted = metadata.width / metadata.height > 3 || metadata.height / metadata.width > 3;

  const strictPassed =
    blurScore >= 12 &&
    watermarkScore < 0.38 &&
    !hasText &&
    !looksDistorted &&
    edgeVariance > 350;

  const relaxedPassed =
    blurScore >= 4 &&
    !looksDistorted &&
    edgeVariance > 120;

  const passed = strictValidation ? strictPassed : relaxedPassed;

  const noteParts = [];
  if (blurScore < 12) {
    noteParts.push('Image appears blurry or lacks enough edge clarity.');
  }
  if (watermarkScore >= 0.38) {
    noteParts.push('Possible watermark or corner overlay detected.');
  }
  if (hasText) {
    noteParts.push('OCR detected visible text or pricing overlay on the image.');
  }
  if (looksDistorted) {
    noteParts.push('Image appears stretched or distorted.');
  }
  if (cornerDensity > 0.42) {
    noteParts.push('Image corners contain dense overlay pixels, which can indicate props or branding.');
  }

  if (!strictValidation && noteParts.length > 0 && passed) {
    noteParts.push('Image accepted in relaxed mode. Enable STRICT_IMAGE_VALIDATION=true to enforce strict rejection.');
  }

  return {
    passed,
    status: passed ? 'Passed' : 'Rejected',
    note: passed ? 'Image passed catalogue quality validation.' : noteParts.join(' '),
    resolution: {
      width: metadata.width,
      height: metadata.height,
    },
    blurScore: Number(blurScore.toFixed(2)),
    watermarkScore: Number(watermarkScore.toFixed(2)),
    edgeVariance: Number(edgeVariance.toFixed(2)),
    hasText,
    profile: {
      brightness: Number(brightness.toFixed(2)),
      saturation: Number(saturation.toFixed(3)),
      blueBias: Number(blueBias.toFixed(3)),
      contrast: Number(contrast.toFixed(2)),
      aspectRatio: Number((metadata.width / metadata.height).toFixed(2)),
    },
  };
}

module.exports = {
  inspectImage,
};
