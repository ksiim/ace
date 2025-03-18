export interface User {
  name: string;
  surname: string;
  patronymic: string;
  admin: boolean;
  organizer: boolean;
  end_of_subscription: string | null; // Можем ожидать null для конца подписки
  updated_at: string;
  created_at: string;
  phone_number: string;
  email: string;
  id: number;
}
