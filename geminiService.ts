
import { GoogleGenAI, Type } from "@google/genai";

// Assume process.env.API_KEY is configured in the environment
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY for Gemini is not set. Receipt analysis will not work.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const fileToGenerativePart = (file: File) => {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        return reject(new Error("Failed to read file as base64 string."));
      }
      const base64String = reader.result.split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};


export const extractDetailsFromReceipt = async (imageFile: File) => {
  if (!API_KEY) {
    throw new Error("API Key no está configurada.");
  }

  const imagePart = await fileToGenerativePart(imageFile);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      parts: [
        { text: `Tu tarea es actuar como un experto en reconocimiento óptico de caracteres (OCR) especializado en comprobantes de pago bancarios de Venezuela. La imagen proporcionada es una fotografía de un recibo, probablemente tomada con un teléfono móvil, por lo que puede tener distorsión de perspectiva, mala iluminación, reflejos o estar ligeramente desenfocada. Extrae los siguientes tres datos con la máxima precisión:

1.  **Fecha de la Transacción:**
    *   Busca etiquetas como 'Fecha', 'Emitido el', etc.
    *   Reconoce formatos comunes como DD/MM/YYYY, DD-MM-YYYY.
    *   Devuelve la fecha SIEMPRE en formato estricto **YYYY-MM-DD**. Si la fecha es '25/07/2024', la salida debe ser '2024-07-25'.

2.  **Monto Total del Depósito:**
    *   Busca el valor monetario principal, a menudo etiquetado como 'Monto', 'Total a Pagar', 'Valor'.
    *   Este valor estará en Bolívares (Bs. o VES).
    *   **CRÍTICO**: Los recibos venezolanos usan la coma (,) como separador decimal y el punto (.) para los miles. Debes interpretar 'Bs. 1.234,56' como el número \`1234.56\`. Ignora los puntos de miles y reemplaza la coma decimal por un punto.
    *   Si hay varios montos, elige el que represente el total de la transacción.

3.  **Número de Referencia Bancaria:**
    *   Busca etiquetas como 'Referencia', 'Nro. de Referencia', 'Confirmación', 'Nro. de Operación', 'Ref.'.
    *   Suele ser una cadena de 6 a 12 dígitos, pero puede ser más larga.
    *   Sé meticuloso al transcribir este número.

**Reglas Importantes:**
*   Si un campo es completamente ilegible o no se encuentra en la imagen, devuelve un string vacío ('') para 'date' y 'reference', y el número 0 para 'amount'.
*   No inventes ni adivines información. La precisión es clave.
*   Concéntrate exclusivamente en extraer estos tres campos del cuerpo de la transacción.` },
        imagePart,
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          date: {
            type: Type.STRING,
            description: "La fecha de la transacción en formato YYYY-MM-DD.",
          },
          amount: {
            type: Type.NUMBER,
            description: "El monto de la transacción como un número, usando punto como separador decimal.",
          },
          reference: {
            type: Type.STRING,
            description: "El número de referencia de la transacción.",
          },
        },
      },
    },
  });

  try {
    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText);
    return {
      date: parsed.date || '',
      amount: parsed.amount || 0,
      reference: parsed.reference || '',
    };
  } catch (error) {
    console.error("Error parsing Gemini response:", error);
    throw new Error("No se pudo analizar la información del recibo. Por favor, ingrese los datos manualmente.");
  }
};
