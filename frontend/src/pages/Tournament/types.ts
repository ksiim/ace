export interface TournamentPage {
  id: number;
  name: string;
  type: string;
  is_child: boolean;
  photo_path: string;
  organizer_name_and_contacts: string;
  organizer_requisites: string;
  description: string;
  date: string;
  price: number;
  can_register: boolean;
  address: string;
  prize_fund: number;
  owner_id: number;
  sex_id: number;
  category_id: number;
  region_id: number;
}

export interface User{
  name: string;
  surname: string;
  patronymic: string;
  admin: boolean;
  organizer: boolean;
  end_of_subscription: string;
  updated_at: string;
  created_at: string;
  phone_number: string;
  email: string;
  id: number;
}

export interface Participant {
  id: number;
  confirmed: boolean;
  user_id: number;
  partner_id: number | null;
  participant_name: string;
  tournament_id: number;
}

export interface Sex {
  id: number;
  name: string;
  shortname: string;
}


export interface ParticipantsListProps {
  participants: Participant[];
}

export interface Fio {
  name: string;
  surname: string;
  patronymic: string;
}
