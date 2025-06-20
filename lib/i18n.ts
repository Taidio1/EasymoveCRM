// Prosty system i18n dla formularza
export type Language = 'pl' | 'en';

export interface Translations {
  // Nagłówek
  title: string;
  subtitle: string;
  description: string;

  // Benefity
  benefits: {
    consultation: string;
    response: string;
    advisory: string;
  };

  // Formularz - labels
  form: {
    title: string;
    description: string;
    name: string;
    email: string;
    phone: string;
    purpose: string;
    country: string;
    files: string;
    filesDescription: string;
    required: string;
    submit: string;
    submitting: string;
    uploadingFiles: string;
  };

  // Opcje celu pobytu
  purposes: {
    work: string;
    study: string;
    family: string;
    other: string;
  };

  // Placeholders
  placeholders: {
    name: string;
    email: string;
    phone: string;
    purpose: string;
    country: string;
  };

  // Walidacja - błędy
  validation: {
    nameMin: string;
    nameMax: string;
    emailRequired: string;
    emailInvalid: string;
    phoneMin: string;
    phoneMax: string;
    phoneInvalid: string;
    purposeRequired: string;
    countryRequired: string;
    invalidFileType: string;
    fileTooLarge: string;
  };

  // Sukces
  success: {
    title: string;
    description: string;
    summary: string;
    nextSteps: string;
    steps: string[];
    newApplication: string;
    homepage: string;
  };

  // Informacje
  info: {
    dataProcessing: string;
    dataDescription: string;
  };

  // Kontakt
  contact: {
    phone: string;
    email: string;
  };

  // Footer
  footer: {
    rights: string;
    contact: string;
  };

  // Inne
  loading: string;
  selectFiles: string;
  selectedFiles: string;
  remove: string;
  cancel: string;
}

const translations: Record<Language, Translations> = {
  pl: {
    title: "Easy Move",
    subtitle: "Legalizacja pobytu w Polsce",
    description: "Profesjonalna pomoc w legalizacji pobytu w Polsce. Wypełnij formularz, a nasz zespół skontaktuje się z Tobą w ciągu 24 godzin.",

    benefits: {
      consultation: "Bezpłatna konsultacja",
      response: "Szybka odpowiedź",
      advisory: "Profesjonalne doradztwo"
    },

    form: {
      title: "Wniosek o legalizację pobytu",
      description: "Wypełnij formularz, aby rozpocząć proces legalizacji pobytu w Polsce z Easy Move",
      name: "Imię i nazwisko",
      email: "Adres email",
      phone: "Numer telefonu",
      purpose: "Cel pobytu",
      country: "Kraj pochodzenia",
      files: "Załączniki",
      filesDescription: "Możesz załączyć dokumenty (PDF, JPG, PNG, max 10MB każdy)",
      required: "wymagane",
      submit: "Wyślij wniosek",
      submitting: "Wysyłanie wniosku...",
      uploadingFiles: "Wgrywanie plików..."
    },

    purposes: {
      work: "Praca",
      study: "Nauka",
      family: "Połączenie z rodziną",
      other: "Inne"
    },

    placeholders: {
      name: "np. Jan Kowalski",
      email: "jan@example.com",
      phone: "+48 123 456 789",
      purpose: "Wybierz cel pobytu",
      country: "Wybierz kraj"
    },

    validation: {
      nameMin: "Imię i nazwisko musi mieć co najmniej 2 znaki",
      nameMax: "Imię i nazwisko nie może przekraczać 100 znaków",
      emailRequired: "Email jest wymagany",
      emailInvalid: "Podaj prawidłowy adres email",
      phoneMin: "Numer telefonu musi mieć co najmniej 9 cyfr",
      phoneMax: "Numer telefonu nie może przekraczać 15 cyfr",
      phoneInvalid: "Podaj prawidłowy numer telefonu",
      purposeRequired: "Wybierz cel pobytu",
      countryRequired: "Wybierz kraj pochodzenia",
      invalidFileType: "ma nieprawidłowy format. Dozwolone: PDF, JPG, PNG",
      fileTooLarge: "jest za duży. Maksymalny rozmiar: 10MB"
    },

    success: {
      title: "Wniosek wysłany pomyślnie!",
      description: "Dziękujemy za przesłanie wniosku. Skontaktujemy się z Tobą w najbliższym czasie.",
      summary: "Podsumowanie wniosku:",
      nextSteps: "Następne kroki:",
      steps: [
        "Przeanalizujemy Twój wniosek w ciągu 1-2 dni roboczych",
        "Skontaktujemy się z Tobą telefonicznie lub mailem",
        "W razie pytań zadzwoń: +48 574 255 295 (Marcin)"
      ],
      newApplication: "Złóż kolejny wniosek",
      homepage: "Strona główna Easy Move"
    },

    info: {
      dataProcessing: "Informacja o przetwarzaniu danych",
      dataDescription: "Wysyłając formularz wyrażasz zgodę na przetwarzanie danych osobowych przez Easy Move w celu realizacji usług legalizacyjnych."
    },

    contact: {
      phone: "Telefon",
      email: "Email"
    },

    footer: {
      rights: "© 2024 Easy Move. Wszystkie prawa zastrzeżone.",
      contact: "Kontakt: 📞 +48 574 255 295 (Marcin) | 📞 +48 669 339 880 (Anna)"
    },

    loading: "Ładowanie...",
    selectFiles: "Wybierz pliki",
    selectedFiles: "Wybrane pliki",
    remove: "Usuń",
    cancel: "Anuluj"
  },

  en: {
    title: "Easy Move",
    subtitle: "Residence Legalization in Poland",
    description: "Professional assistance with residence legalization in Poland. Fill out the form and our team will contact you within 24 hours.",

    benefits: {
      consultation: "Free consultation",
      response: "Quick response",
      advisory: "Professional advice"
    },

    form: {
      title: "Residence Legalization Application",
      description: "Fill out the form to start the residence legalization process in Poland with Easy Move",
      name: "Full name",
      email: "Email address",
      phone: "Phone number",
      purpose: "Purpose of stay",
      country: "Country of origin",
      files: "Attachments",
      filesDescription: "You can attach documents (PDF, JPG, PNG, max 10MB each)",
      required: "required",
      submit: "Submit application",
      submitting: "Submitting application...",
      uploadingFiles: "Uploading files..."
    },

    purposes: {
      work: "Work",
      study: "Study",
      family: "Family reunification",
      other: "Other"
    },

    placeholders: {
      name: "e.g. John Smith",
      email: "john@example.com",
      phone: "+48 123 456 789",
      purpose: "Select purpose of stay",
      country: "Select country"
    },

    validation: {
      nameMin: "Full name must have at least 2 characters",
      nameMax: "Full name cannot exceed 100 characters",
      emailRequired: "Email is required",
      emailInvalid: "Please provide a valid email address",
      phoneMin: "Phone number must have at least 9 digits",
      phoneMax: "Phone number cannot exceed 15 digits",
      phoneInvalid: "Please provide a valid phone number",
      purposeRequired: "Please select purpose of stay",
      countryRequired: "Please select country of origin",
      invalidFileType: "has invalid format. Allowed: PDF, JPG, PNG",
      fileTooLarge: "is too large. Maximum size: 10MB"
    },

    success: {
      title: "Application submitted successfully!",
      description: "Thank you for submitting your application. We will contact you shortly.",
      summary: "Application summary:",
      nextSteps: "Next steps:",
      steps: [
        "We will analyze your application within 1-2 business days",
        "We will contact you by phone or email",
        "For questions call: +48 574 255 295 (Marcin)"
      ],
      newApplication: "Submit another application",
      homepage: "Easy Move homepage"
    },

    info: {
      dataProcessing: "Data processing information",
      dataDescription: "By submitting this form you consent to the processing of personal data by Easy Move for the purpose of providing legalization services."
    },

    contact: {
      phone: "Phone",
      email: "Email"
    },

    footer: {
      rights: "© 2024 Easy Move. All rights reserved.",
      contact: "Contact: 📞 +48 574 255 295 (Marcin) | 📞 +48 669 339 880 (Anna)"
    },

    loading: "Loading...",
    selectFiles: "Select files",
    selectedFiles: "Selected files",
    remove: "Remove",
    cancel: "Cancel"
  }
};

// Hook do używania tłumaczeń
export function useTranslations(language: Language = 'pl'): Translations {
  return translations[language];
}

// Funkcja pomocnicza do formatowania tekstu z parametrami
export function formatTranslation(template: string, params: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => params[key] || match);
} 