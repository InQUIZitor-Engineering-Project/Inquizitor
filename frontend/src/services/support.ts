import { apiRequest } from "./api";

export interface ContactFormData {
  email: string;
  first_name?: string;
  last_name?: string;
  category: string;
  subject: string;
  message: string;
}

export async function sendContactForm(data: ContactFormData) {
  const response = await apiRequest("/support/contact", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    
    // Obsługa błędów walidacji FastAPI (Pydantic)
    if (response.status === 422 && Array.isArray(errorBody.detail)) {
      const messages = errorBody.detail.map((err: any) => {
        const field = err.loc[err.loc.length - 1];
        const msg = err.msg;
        
        // Mapowanie pól na polskie nazwy dla lepszego UX
        const fieldNames: Record<string, string> = {
          message: "Wiadomość",
          subject: "Temat",
          email: "Adres email",
          first_name: "Imię",
          last_name: "Nazwisko",
          category: "Kategoria"
        };

        const translatedField = fieldNames[field] || field;
        
        // Tłumaczenie typowych komunikatów Pydantic
        if (msg.includes("at least 10 characters")) return `${translatedField} musi mieć co najmniej 10 znaków.`;
        if (msg.includes("value is not a valid email")) return `${translatedField}: podaj poprawny adres e-mail.`;
        
        return `${translatedField}: ${msg}`;
      });
      
      throw new Error(messages.join("\n"));
    }

    throw new Error(errorBody.detail || "Wystąpił błąd podczas wysyłania wiadomości.");
  }

  return response.json();
}

